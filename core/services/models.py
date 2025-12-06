from django.db import models
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import os

User = settings.AUTH_USER_MODEL


def work_file_upload_path(instance, filename):
    """Generate upload path for work files"""
    # Create path like: work_files/customer_name/work_id/filename
    customer_name = instance.work.customer_name.replace(' ', '_')
    return f'work_files/{customer_name}/{instance.work.id}/{filename}'


class JobCategory(models.Model):
    """Categories for organizing different types of work/jobs"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text='Hex color code for UI display')
    is_active = models.BooleanField(default=True)
    send_completion_notification = models.BooleanField(
        default=False, 
        help_text='Send SMS notification to customer when work in this category is completed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_categories_created'
    )

    class Meta:
        verbose_name_plural = "Job Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Work(models.Model):
    # Customer information stored directly on work
    customer_name = models.CharField(max_length=255, blank=True, default='', help_text='Customer name (optional, only needed for notifications)')
    customer_phone = models.CharField(max_length=20, blank=True, default='', help_text='Customer phone number for SMS notifications (optional)')
    
    title = models.CharField(max_length=200, help_text='Brief title for this work/job')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        JobCategory, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='works', help_text='Job category for better organization'
    )
    worker = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='works_done'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True, null=True)  # Memo field for workers

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        customer = self.customer_name if self.customer_name else "No Customer"
        return f"{self.title} - {customer}"

    def save(self, *args, **kwargs):
        # Auto-set completed_at when work is marked as completed
        if self.completed and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        elif not self.completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def get_total_payments(self):
        """Calculate total amount paid for this work"""
        from django.db.models import Sum
        total = self.payments.aggregate(total=Sum('amount'))['total']
        return total if total is not None else 0

    def get_remaining_balance(self):
        """Calculate remaining balance for this work"""
        return self.price - self.get_total_payments()

    def is_fully_paid(self):
        """Check if work is fully paid (total payments >= work price)"""
        return self.get_total_payments() >= self.price


class WorkFile(models.Model):
    """File attachments for work items"""
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to=work_file_upload_path, max_length=500)
    original_name = models.CharField(max_length=255, help_text='Original filename when uploaded')
    file_type = models.CharField(max_length=50, blank=True, null=True)
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    description = models.CharField(max_length=500, blank=True, null=True, help_text='Optional description of the file')
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_work_files'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_name} - {self.work.title}"

    def save(self, *args, **kwargs):
        if self.file:
            # Auto-populate file metadata
            self.original_name = self.file.name
            self.file_size = self.file.size
            
            # Determine file type from extension
            _, ext = os.path.splitext(self.file.name.lower())
            file_type_mapping = {
                '.pdf': 'PDF Document',
                '.doc': 'Word Document',
                '.docx': 'Word Document', 
                '.jpg': 'Image',
                '.jpeg': 'Image',
                '.png': 'Image',
                '.gif': 'Image',
                '.txt': 'Text File',
                '.zip': 'Archive',
                '.rar': 'Archive',
                '.xlsx': 'Excel Spreadsheet',
                '.xls': 'Excel Spreadsheet',
                '.ppt': 'PowerPoint',
                '.pptx': 'PowerPoint'
            }
            self.file_type = file_type_mapping.get(ext, 'Unknown')
            
        super().save(*args, **kwargs)

    def get_file_size_display(self):
        """Return human-readable file size"""
        if not self.file_size:
            return 'Unknown size'
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


class Payment(models.Model):
    work = models.ForeignKey(Work, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=50, choices=(
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
    ))
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    # NEW: track which employee recorded the payment
    processed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='payments_processed'
    )
    # Allow employee to attach a note when creating/correcting a payment
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.amount} for {self.work}"


class EmployeeProfile(models.Model):
    """Extra tracking information for employees (optional)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_profile')
    position = models.CharField(max_length=100, blank=True, null=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or str(self.user)


class DailySalesReport(models.Model):
    """Daily sales report generated by employees"""
    date = models.DateField()
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='sales_reports_generated'
    )
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Calculated totals
    total_sales_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payments_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['date', 'generated_by']
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        user_name = str(self.generated_by) if self.generated_by else "Deleted User"
        return f"Sales Report - {self.date} by {user_name}"
    
    def can_be_edited_by(self, user):
        """Check if user can edit this report"""
        if user.is_admin:
            return True
        if not self.is_submitted and self.generated_by == user:
            return True
        return False
    
    def submit_report(self):
        """Submit the report (locks it for non-admin users)"""
        if not self.is_submitted:
            from django.utils import timezone
            self.is_submitted = True
            self.submitted_at = timezone.now()
            self.calculate_totals()
            self.save()
    
    def calculate_totals(self):
        """Calculate all report totals"""
        # Calculate sales totals from report items
        items = self.report_items.all()
        self.total_sales_amount = sum(item.total_amount for item in items)
        self.total_payments_received = sum(item.payments_received for item in items)
        self.total_outstanding = self.total_sales_amount - self.total_payments_received
        
        # Calculate total expenses
        self.total_expenses = self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        # Net total = total payments received - total expenses
        self.net_total = self.total_payments_received - self.total_expenses


class DailySalesReportItem(models.Model):
    """Individual category items in a daily sales report"""
    report = models.ForeignKey(
        DailySalesReport, on_delete=models.CASCADE, related_name='report_items'
    )
    category = models.ForeignKey(
        JobCategory, on_delete=models.CASCADE, related_name='report_items'
    )
    
    # Category totals for the day
    total_works = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payments_received = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    outstanding_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['report', 'category']
    
    def __str__(self):
        return f"{self.category.name} - {self.report.date}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate outstanding amount
        self.outstanding_amount = self.total_amount - self.payments_received
        super().save(*args, **kwargs)


class SalesReportNote(models.Model):
    """Notes that employees can add to sales after submission"""
    report = models.ForeignKey(
        DailySalesReport, on_delete=models.CASCADE, related_name='notes'
    )
    added_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='sales_notes_added'
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        user_name = str(self.added_by) if self.added_by else "Deleted User"
        return f"Note on {self.report.date} by {user_name}"


class DailyExpense(models.Model):
    """Daily expenses recorded in sales reports"""
    report = models.ForeignKey(
        DailySalesReport, on_delete=models.CASCADE, related_name='expenses'
    )
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, choices=[
        ('office_supplies', 'Office Supplies'),
        ('transport', 'Transport'),
        ('meals', 'Meals'),
        ('utilities', 'Utilities'),
        ('maintenance', 'Maintenance'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ], default='other')
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='expenses_recorded'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.description} - {self.amount}"


# ============ PROCUREMENT & INVENTORY MODELS ============

class Material(models.Model):
    """Materials used in printing operations (paper, ink, binding supplies, etc.)"""
    
    CATEGORY_CHOICES = [
        ('paper', 'Paper'),
        ('ink', 'Ink'),
        ('binding', 'Binding Supplies'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255, help_text='Human-readable name for the material')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    unit = models.CharField(max_length=50, help_text='Unit of measure (reams, liters, sheets, etc.)')
    current_stock = models.IntegerField(
        default=0,
        help_text='Current stock quantity'
    )
    reorder_level = models.IntegerField(
        default=0,
        help_text='Minimum stock level before reorder alert'
    )
    archived = models.BooleanField(default=False, help_text='Soft delete flag')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.unit})"
    
    def is_low_stock(self):
        """Check if current stock is at or below reorder level"""
        return self.current_stock <= self.reorder_level
    
    def get_suggested_reorder_quantity(self):
        """Simple suggestion: reorder_level * 2"""
        return self.reorder_level * 2


class MaterialUsage(models.Model):
    """Track when employees pick materials from inventory"""
    
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='usage_records')
    quantity_taken = models.IntegerField()
    taken_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='materials_taken')
    taken_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True, help_text='Optional note about the material usage')
    
    # Track stock levels at the time of usage for audit purposes
    stock_before = models.IntegerField(help_text='Stock level before taking materials')
    stock_after = models.IntegerField(help_text='Stock level after taking materials')
    
    class Meta:
        ordering = ['-taken_at']
    
    def __str__(self):
        user_name = self.taken_by.get_full_name() or self.taken_by.username if self.taken_by else "Deleted User"
        return f"{user_name} took {self.quantity_taken} {self.material.unit} of {self.material.name}"


class Procurement(models.Model):
    """Purchase orders/records for materials from suppliers"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='procurements')
    
    quantity_ordered = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)  # computed and stored
    
    order_date = models.DateTimeField(default=timezone.now)
    delivery_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='procurements_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Procurement #{self.id} - {self.material.name} from {self.supplier_name}"
    
    def save(self, *args, **kwargs):
        # Always compute total_cost
        self.total_cost = self.quantity_ordered * self.unit_cost
        super().save(*args, **kwargs)


class JobMaterial(models.Model):
    """Materials consumed by a work order/job"""
    
    job = models.ForeignKey('Work', on_delete=models.CASCADE, related_name='job_materials')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='job_usages')
    quantity_used = models.IntegerField()
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='job_materials_recorded')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.material.name} ({self.quantity_used}) used for {self.job.title}"


class StockMovement(models.Model):
    """Immutable audit log of all stock changes"""
    
    MOVEMENT_TYPE_CHOICES = [
        ('inflow', 'Inflow'),
        ('outflow', 'Outflow'),
    ]
    
    REFERENCE_TYPE_CHOICES = [
        ('procurement', 'Procurement'),
        ('job', 'Job Usage'),
        ('adjustment', 'Manual Adjustment'),
        ('material_usage', 'Material Pickup'),
    ]
    
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()
    reference_type = models.CharField(max_length=20, choices=REFERENCE_TYPE_CHOICES)
    reference_id = models.PositiveIntegerField(help_text='ID of procurement, job, adjustment, or material usage record')
    note = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.movement_type.title()} - {self.material.name}: {self.quantity}"


class CustomerContact(models.Model):
    """
    Store customer contact information for marketing and promotional SMS.
    Automatically populated when a work is created with customer info.
    """
    name = models.CharField(max_length=255, help_text='Customer full name')
    phone = models.CharField(max_length=20, unique=True, help_text='Customer phone number (unique)')
    
    # Marketing preferences
    opted_out = models.BooleanField(
        default=False, 
        help_text='Customer has opted out of promotional messages'
    )
    
    # Tracking
    first_work_date = models.DateTimeField(
        auto_now_add=True, 
        help_text='Date when customer was first added'
    )
    last_work_date = models.DateTimeField(
        auto_now=True, 
        help_text='Date of most recent work'
    )
    total_works = models.IntegerField(
        default=0, 
        help_text='Total number of works for this customer'
    )
    total_spent = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text='Total amount spent by customer'
    )
    
    # Additional info
    notes = models.TextField(
        blank=True, 
        null=True, 
        help_text='Optional notes about this customer'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_work_date']
        verbose_name = 'Customer Contact'
        verbose_name_plural = 'Customer Contacts'
    
    def __str__(self):
        return f"{self.name} - {self.phone}"
    
    def can_receive_marketing(self):
        """Check if customer can receive marketing messages"""
        return not self.opted_out


class MarketingMessage(models.Model):
    """
    Template messages for marketing campaigns.
    Allows creating, saving, and reusing promotional messages.
    """
    title = models.CharField(
        max_length=200, 
        help_text='Internal name for this message template'
    )
    message = models.TextField(
        max_length=500,
        help_text='The promotional message content (max 500 characters)'
    )
    link_url = models.URLField(
        blank=True,
        null=True,
        max_length=500,
        help_text='Optional URL to include in the message'
    )
    link_text = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Text to display for the link (e.g., "Click here")'
    )
    
    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this message template is active and available for use'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marketing_messages_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Usage tracking
    times_used = models.IntegerField(
        default=0,
        help_text='Number of times this message has been sent'
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date this message was last sent'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Marketing Message'
        verbose_name_plural = 'Marketing Messages'
    
    def __str__(self):
        return self.title
    
    def get_full_message(self):
        """Return the complete message with link if provided"""
        message = self.message
        if self.link_url:
            link_display = self.link_text if self.link_text else self.link_url
            message += f"\n\n{link_display}: {self.link_url}"
        return message
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        from django.utils import timezone
        self.times_used += 1
        self.last_used = timezone.now()
        self.save(update_fields=['times_used', 'last_used'])


class Notification(models.Model):
    """Real-time notifications for work and inventory updates"""
    
    NOTIFICATION_TYPES = [
        # Work notifications
        ('new_work', 'New Work'),
        ('work_reopened', 'Work Reopened'),
        ('work_completed', 'Work Completed'),
        
        # Inventory notifications
        ('low_stock', 'Low Stock Alert'),
        ('material_request', 'Material Request'),
        ('procurement_created', 'Procurement Created'),
        ('procurement_delivered', 'Procurement Delivered'),
        ('material_pickup', 'Material Pickup'),
    ]
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related objects (optional - depends on notification type)
    work_order = models.ForeignKey(
        Work,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    procurement = models.ForeignKey(
        Procurement,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} - {self.recipient.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
