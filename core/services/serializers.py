from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import (
    Work, Payment, EmployeeProfile, JobCategory, WorkFile,
    DailySalesReport, DailySalesReportItem, SalesReportNote, DailyExpense,
    Material, PendingStockAdjustment, Procurement, JobMaterial, StockMovement, MaterialUsage,
    CustomerContact, MarketingMessage, Notification
)

User = get_user_model()


class JobCategorySerializer(serializers.ModelSerializer):
    """Serializer for job categories"""
    created_by = serializers.StringRelatedField(read_only=True)
    works_count = serializers.SerializerMethodField(read_only=True)
    default_material_name = serializers.CharField(source='default_material.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'description', 'color', 'is_active', 'send_completion_notification',
              'unit_rate', 'pricing_unit', 'material', 'material_name',
              'default_material', 'default_material_name', 'created_at', 'created_by', 'works_count']

    def get_works_count(self, obj):
        return obj.works.count()


class WorkFileSerializer(serializers.ModelSerializer):
    """Serializer for work file attachments"""
    uploaded_by = serializers.StringRelatedField(read_only=True)
    file_size_display = serializers.SerializerMethodField(read_only=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkFile
        fields = [
            'id', 'file', 'file_url', 'original_name', 'file_type', 'file_size', 
            'file_size_display', 'description', 'uploaded_by', 'uploaded_at'
        ]

    def get_file_size_display(self, obj):
        return obj.get_file_size_display()

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class WorkSerializer(serializers.ModelSerializer):
    """Enhanced work serializer with title, category, and file support"""
    # Customer info is now directly on the Work model (optional)
    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    
    # Category handling
    category = serializers.PrimaryKeyRelatedField(
        queryset=JobCategory.objects.filter(is_active=True), 
        required=False, 
        allow_null=True
    )
    category_name = serializers.SerializerMethodField(read_only=True)
    category_color = serializers.SerializerMethodField(read_only=True)
    category_send_notification = serializers.SerializerMethodField(read_only=True)
    
    # Worker details
    worker = serializers.StringRelatedField(read_only=True)
    worker_name = serializers.SerializerMethodField(read_only=True)
    
    # File attachments
    files = WorkFileSerializer(many=True, read_only=True)
    files_count = serializers.SerializerMethodField(read_only=True)
    
    # Payment information
    total_payments = serializers.SerializerMethodField(read_only=True)
    remaining_balance = serializers.SerializerMethodField(read_only=True)
    is_fully_paid = serializers.SerializerMethodField(read_only=True)
    
    # Status information
    status = serializers.SerializerMethodField(read_only=True)
    
    # Overdue information
    days_outstanding = serializers.SerializerMethodField(read_only=True)
    is_overdue = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Work
        fields = [
            'id', 'customer_name', 'customer_phone',
            'title', 'description', 'price', 
            'category', 'category_name', 'category_color', 'category_send_notification',
            'material', 'material_quantity_used',
            'material_used', 'material_quantity', 'calculated_amount', 'discount_amount', 'net_amount', 'due_date',
            'worker', 'worker_name',
            'created_at', 'completed', 'completed_at', 'note', 'is_credit', 'credit_cleared', 'credit_cleared_at',
            'files', 'files_count', 
            'total_payments', 'remaining_balance', 'is_fully_paid', 'status',
            'days_outstanding', 'is_overdue'
        ]

    def get_category_name(self, obj):
        try:
            return obj.category.name if obj.category else None
        except Exception:
            return None

    def get_category_color(self, obj):
        try:
            return obj.category.color if obj.category else '#6B7280'  # Default gray
        except Exception:
            return '#6B7280'
    
    def get_category_send_notification(self, obj):
        try:
            return obj.category.send_completion_notification if obj.category else False
        except Exception:
            return False

    def get_worker_name(self, obj):
        try:
            return obj.worker.get_full_name() or obj.worker.username if obj.worker else None
        except Exception:
            return None

    def get_files_count(self, obj):
        return obj.files.count()

    def get_total_payments(self, obj):
        return obj.get_total_payments()

    def get_remaining_balance(self, obj):
        return obj.get_remaining_balance()

    def get_is_fully_paid(self, obj):
        return obj.is_fully_paid()

    def get_status(self, obj):
        if obj.completed:
            return 'completed'
        elif obj.worker:
            return 'in_progress'
        else:
            return 'pending'

    def get_days_outstanding(self, obj):
        return obj.get_days_outstanding()

    def get_is_overdue(self, obj):
        return obj.is_overdue(days_threshold=2)


class WorkCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating works - customer info is optional (only needed for notifications)"""
    
    # Payment fields (optional - to mark work as paid immediately)
    mark_as_paid = serializers.BooleanField(required=False, default=False, write_only=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0, write_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    due_date = serializers.DateField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(
        choices=[('cash', 'Cash'), ('mobile_money', 'Mobile Money'), ('card', 'Card'), ('bank_transfer', 'Bank Transfer'), ('none', 'None')],
        required=False, 
        allow_blank=True,
        write_only=True
    )
    payment_tracking_number = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    payment_note = serializers.CharField(required=False, allow_blank=True, write_only=True)
    material_quantity_used = serializers.FloatField(min_value=0.000001, required=False, write_only=True)
    material_quantity = serializers.FloatField(min_value=0.000001, required=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Work
        fields = ['customer_name', 'customer_phone', 'title', 'description', 'price', 'category', 'material_quantity_used',
              'material_quantity', 'discount_amount', 'due_date', 'note', 'worker', 'is_credit', 'mark_as_paid',
              'amount_paid', 'payment_method', 'payment_tracking_number', 'payment_note']
        extra_kwargs = {
            'category': {'required': True, 'allow_null': False},
        }

    def validate_title(self, value):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value.strip()

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
    
    def validate_customer_name(self, value):
        # Customer name is optional, just clean it if provided
        if value:
            return value.strip()
        return value
    
    def validate_customer_phone(self, value):
        # Customer phone is optional, validate only if provided
        if value and value.strip():
            if len(value.strip()) < 10:
                raise serializers.ValidationError("Phone number must be at least 10 digits")
            return value.strip()
        return value
    
    def validate(self, attrs):
        category = attrs.get('category')
        if not category:
            raise serializers.ValidationError({'category': 'Select a job category'})
        material = category.material or category.default_material
        if not material:
            raise serializers.ValidationError({
                'category': 'This category has no default material configured'
            })
        quantity = attrs['material_quantity']
        calculated_amount = (Decimal(str(quantity)) * category.unit_rate).quantize(Decimal('0.01'))
        discount = attrs.get('discount_amount', Decimal('0'))
        if discount < 0 or discount > calculated_amount:
            raise serializers.ValidationError({'discount_amount': 'Discount must be between zero and the calculated amount'})
        net_amount = calculated_amount - discount
        amount_paid = attrs.get('amount_paid', Decimal('0'))
        if amount_paid < 0 or amount_paid > net_amount:
            raise serializers.ValidationError({'amount_paid': 'Amount paid must be between zero and the net amount'})
        balance = net_amount - amount_paid
        if balance > 0 and not attrs.get('due_date'):
            raise serializers.ValidationError({'due_date': 'A due date is required for a remaining balance'})
        if balance == 0:
            attrs['due_date'] = None
        attrs['material_used'] = material
        attrs['material'] = material
        attrs['material_quantity_used'] = quantity
        attrs['calculated_amount'] = calculated_amount
        attrs['net_amount'] = net_amount
        attrs['price'] = net_amount
        attrs['is_credit'] = balance > 0

        if amount_paid > 0 and attrs.get('payment_method') in (None, '', 'none'):
            raise serializers.ValidationError({
                'payment_method': 'Payment method is required when recording a payment'
            })
        return attrs


class WorkFileUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading files to work items"""
    class Meta:
        model = WorkFile
        fields = ['file', 'description']

    def validate_file(self, value):
        # File size limit (10MB)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(f"File size cannot exceed 10MB. Current size: {value.size / (1024*1024):.1f}MB")

        # Allowed file extensions
        allowed_extensions = [
            '.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', 
            '.zip', '.rar', '.xlsx', '.xls', '.ppt', '.pptx'
        ]
        
        import os
        _, ext = os.path.splitext(value.name.lower())
        if ext not in allowed_extensions:
            raise serializers.ValidationError(f"File type '{ext}' not allowed. Allowed types: {', '.join(allowed_extensions)}")

        return value


class PaymentSerializer(serializers.ModelSerializer):
    # allow write via work id, but provide work details for read
    work = serializers.PrimaryKeyRelatedField(queryset=Work.objects.all())
    work_description = serializers.SerializerMethodField(read_only=True)
    work_title = serializers.SerializerMethodField(read_only=True)
    work_price = serializers.SerializerMethodField(read_only=True)
    work_total_paid = serializers.SerializerMethodField(read_only=True)
    work_balance = serializers.SerializerMethodField(read_only=True)
    is_full_payment = serializers.SerializerMethodField(read_only=True)
    processed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Payment
        # processed_by will be set from request.user in the view; note is allowed
        fields = [
            'id', 'work', 'work_description', 'work_title', 'work_price', 
            'work_total_paid', 'work_balance', 'is_full_payment',
            'amount', 'paid_at', 'method', 
            'tracking_number', 'processed_by', 'note'
        ]

    def validate(self, attrs):
        work = attrs.get('work')
        amount = attrs.get('amount')

        if work is None:
            raise serializers.ValidationError({'work': 'Work is required'})
        if amount is None:
            raise serializers.ValidationError({'amount': 'Amount is required'})
        if amount <= Decimal('0'):
            raise serializers.ValidationError({'amount': 'Payment amount must be greater than zero'})

        remaining_balance = work.get_remaining_balance()
        if remaining_balance <= Decimal('0'):
            raise serializers.ValidationError({
                'work': 'This work is already fully paid'
            })

        if amount > remaining_balance:
            raise serializers.ValidationError({
                'amount': f'Amount exceeds remaining balance ({remaining_balance})'
            })

        return attrs

    def get_work_description(self, obj):
        try:
            return obj.work.description
        except Exception:
            return None

    def get_work_title(self, obj):
        try:
            return obj.work.title
        except Exception:
            return None
    
    def get_work_price(self, obj):
        try:
            return obj.work.price
        except Exception:
            return None
    
    def get_work_total_paid(self, obj):
        try:
            return obj.work.get_total_payments()
        except Exception:
            return None
    
    def get_work_balance(self, obj):
        try:
            return obj.work.get_remaining_balance()
        except Exception:
            return None
    
    def get_is_full_payment(self, obj):
        try:
            return obj.work.is_fully_paid()
        except Exception:
            return False


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = EmployeeProfile
        fields = "__all__"


# Combined activity serializer
class UserActivitySerializer(serializers.ModelSerializer):
    works_done = WorkSerializer(many=True, read_only=True)
    payments_processed = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "works_done", "payments_processed"]


class WorkerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    worker_permissions = serializers.SerializerMethodField(read_only=True)
    worker_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=User.WORKER_ROLE_CHOICES),
        required=False,
        allow_empty=False,
    )
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "is_active", "worker_role", "worker_roles", "worker_permissions"]
        read_only_fields = ["id", "username", "email", "full_name", "worker_permissions"]
        
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_worker_permissions(self, obj):
        return obj.get_worker_permissions()

    def validate_worker_roles(self, value):
        return list(dict.fromkeys(value))

    def validate(self, attrs):
        request = self.context.get('request')
        if self.instance and request and request.user == self.instance and attrs.get('is_active') is False:
            raise serializers.ValidationError({'is_active': 'You cannot restrict your own account access'})
        return attrs

    def update(self, instance, validated_data):
        worker_roles = validated_data.pop('worker_roles', None)
        instance = super().update(instance, validated_data)
        if worker_roles is not None:
            instance.worker_roles = worker_roles
            instance.worker_role = worker_roles[0]
            instance.save(update_fields=['worker_roles', 'worker_role'])
        return instance


# Simplified serializers for dropdowns/selections
class JobCategorySelectSerializer(serializers.ModelSerializer):
    """Lightweight serializer for category dropdowns"""
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'color', 'unit_rate', 'pricing_unit', 'material', 'material_name', 'material_stock',
              'default_material', 'default_material_name', 'default_material_unit', 'default_material_stock']

    default_material_name = serializers.CharField(source='default_material.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_stock = serializers.FloatField(source='material.current_stock', read_only=True)
    default_material_unit = serializers.CharField(source='default_material.unit', read_only=True)
    default_material_stock = serializers.IntegerField(source='default_material.current_stock', read_only=True)


class WorkSelectSerializer(serializers.ModelSerializer):
    """Lightweight serializer for work dropdowns"""
    customer_name = serializers.CharField(read_only=True)
    total_payments = serializers.SerializerMethodField(read_only=True)
    remaining_balance = serializers.SerializerMethodField(read_only=True)
    is_fully_paid = serializers.SerializerMethodField(read_only=True)
    is_credit = serializers.BooleanField(read_only=True)
    credit_cleared = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Work
        fields = ['id', 'title', 'customer_name', 'price', 'completed', 'is_credit', 'credit_cleared',
                 'total_payments', 'remaining_balance', 'is_fully_paid']

    def get_total_payments(self, obj):
        return obj.get_total_payments()

    def get_remaining_balance(self, obj):
        return obj.get_remaining_balance()

    def get_is_fully_paid(self, obj):
        return obj.is_fully_paid()


# Sales Report Serializers
class DailyExpenseSerializer(serializers.ModelSerializer):
    """Serializer for daily expenses"""
    recorded_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = DailyExpense
        fields = [
            'id', 'description', 'amount', 'category', 'receipt_number',
            'recorded_by', 'recorded_at'
        ]


class DailySalesReportItemSerializer(serializers.ModelSerializer):
    """Serializer for sales report items (category breakdowns)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    
    class Meta:
        model = DailySalesReportItem
        fields = [
            'id', 'category', 'category_name', 'category_color',
            'total_works', 'total_amount', 'payments_received', 'outstanding_amount'
        ]


class SalesReportNoteSerializer(serializers.ModelSerializer):
    """Serializer for sales report notes"""
    added_by = serializers.StringRelatedField(read_only=True)
    added_by_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = SalesReportNote
        fields = ['id', 'note', 'added_by', 'added_by_name', 'created_at']
    
    def get_added_by_name(self, obj):
        return obj.added_by.get_full_name() or obj.added_by.username


class DailySalesReportSerializer(serializers.ModelSerializer):
    """Serializer for daily sales reports"""
    generated_by = serializers.StringRelatedField(read_only=True)
    generated_by_name = serializers.SerializerMethodField(read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)
    report_items = DailySalesReportItemSerializer(many=True, read_only=True)
    expenses = DailyExpenseSerializer(many=True, read_only=True)
    notes = SalesReportNoteSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField(read_only=True)
    can_approve = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = DailySalesReport
        fields = [
            'id', 'date', 'generated_by', 'generated_by_name', 'is_submitted', 'submitted_at',
            'approval_status', 'approved_by', 'approved_by_name', 'approved_at',
            'total_sales_amount', 'total_payments_received', 'total_outstanding',
            'total_expenses', 'net_total', 'created_at', 'updated_at',
            'report_items', 'expenses', 'notes', 'can_edit', 'can_approve'
        ]
    
    def get_generated_by_name(self, obj):
        return obj.generated_by.get_full_name() or obj.generated_by.username

    def get_approved_by_name(self, obj):
        if not obj.approved_by:
            return None
        return obj.approved_by.get_full_name() or obj.approved_by.username
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_be_edited_by(request.user)
        return False

    def get_can_approve(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False
        return request.user.is_admin and obj.approval_status == DailySalesReport.STATUS_PENDING_APPROVAL


class DailySalesReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating daily sales reports"""
    
    class Meta:
        model = DailySalesReport
        fields = ['date']
    
    def validate_date(self, value):
        from django.utils import timezone
        today = timezone.localdate()
        
        if value > today:
            raise serializers.ValidationError("Cannot create reports for future dates")
        
        # Check if report already exists for this date and user
        user = self.context['request'].user
        if DailySalesReport.objects.filter(date=value, generated_by=user).exists():
            raise serializers.ValidationError("A report for this date already exists")
        
        return value


# ============ PROCUREMENT & INVENTORY SERIALIZERS ============

class MaterialUsageSerializer(serializers.ModelSerializer):
    """Serializer for MaterialUsage model"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    taken_by_name = serializers.CharField(source='taken_by.get_full_name', read_only=True)
    
    class Meta:
        model = MaterialUsage
        fields = [
            'id', 'material', 'material_name', 'material_unit',
            'quantity_taken', 'taken_by', 'taken_by_name', 'taken_at',
            'note', 'stock_before', 'stock_after'
        ]
        read_only_fields = ['taken_by', 'taken_at', 'stock_before', 'stock_after']


class MaterialSerializer(serializers.ModelSerializer):
    """Serializer for Material model"""
    is_low_stock = serializers.ReadOnlyField()
    suggested_reorder_quantity = serializers.ReadOnlyField(source='get_suggested_reorder_quantity')
    recent_movements = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'category', 'unit', 'base_unit', 'bulk_unit_name', 'items_per_bulk_unit',
            'current_stock', 'reorder_level', 'reorder_threshold',
            'archived', 'created_at', 'updated_at', 'is_low_stock',
            'suggested_reorder_quantity', 'recent_movements'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_recent_movements(self, obj):
        """Get recent stock movements for this material"""
        if not self.context.get('include_movements'):
            return None
        
        movements = obj.stock_movements.all()[:5]
        return StockMovementSerializer(movements, many=True).data
    
    def validate_current_stock(self, value):
        """Validate current stock value"""
        if value < 0:
            raise serializers.ValidationError("Current stock cannot be negative")
        return value
    
    def validate_reorder_level(self, value):
        """Validate reorder level"""
        if value < 0:
            raise serializers.ValidationError("Reorder level cannot be negative")
        return value

    def validate_items_per_bulk_unit(self, value):
        if value <= 0:
            raise serializers.ValidationError('Items per bulk unit must be greater than zero')
        return value


class PendingStockAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for pending stock adjustments and material additions"""
    material_name_display = serializers.SerializerMethodField(read_only=True)
    material_unit_display = serializers.SerializerMethodField(read_only=True)
    submitted_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PendingStockAdjustment
        fields = [
            'id', 'adjustment_type', 'material', 'material_name_display', 'material_unit_display',
            'material_name', 'material_category', 'material_unit', 'reorder_level',
            'quantity', 'reason', 'status', 'submitted_by', 'submitted_by_name', 'submitted_at',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'rejection_reason'
        ]
        read_only_fields = ['status', 'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'material_name_display', 'material_unit_display']

    def get_material_name_display(self, obj):
        """Get display name for material (from FK or new_material field)"""
        if obj.adjustment_type == 'new_material':
            return obj.material_name
        return obj.material.name if obj.material else 'Unknown Material'

    def get_material_unit_display(self, obj):
        """Get display unit (from FK or new_material field)"""
        if obj.adjustment_type == 'new_material':
            return obj.material_unit
        return obj.material.unit if obj.material else 'Unknown'

    def get_submitted_by_name(self, obj):
        return obj.submitted_by.get_full_name() or obj.submitted_by.username if obj.submitted_by else 'Unknown'

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.username if obj.reviewed_by else None

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive")
        return value

    def validate(self, data):
        adjustment_type = data.get('adjustment_type', self.instance.adjustment_type if self.instance else 'stock_addition')

        if adjustment_type == 'stock_addition':
            if not data.get('material'):
                raise serializers.ValidationError({'material': 'Material is required for stock additions'})
        elif adjustment_type == 'new_material':
            if not data.get('material_name'):
                raise serializers.ValidationError({'material_name': 'Material name is required for new materials'})
            if not data.get('material_category'):
                raise serializers.ValidationError({'material_category': 'Material category is required for new materials'})
            if not data.get('material_unit'):
                raise serializers.ValidationError({'material_unit': 'Material unit is required for new materials'})

        return data


class ProcurementSerializer(serializers.ModelSerializer):
    """Serializer for Procurement model"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Procurement
        fields = [
            'id', 'material', 'material_name', 'material_unit',
            'quantity_ordered', 'unit_cost', 'total_cost',
            'order_date', 'delivery_date', 'status',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_cost', 'created_at', 'updated_at', 'created_by']
    
    def validate_quantity_ordered(self, value):
        """Validate quantity ordered"""
        if value <= 0:
            raise serializers.ValidationError("Quantity ordered must be positive")
        return value
    
    def validate_unit_cost(self, value):
        """Validate unit cost"""
        if value < 0:
            raise serializers.ValidationError("Unit cost cannot be negative")
        return value


class ProcurementDeliverySerializer(serializers.Serializer):
    """Serializer for marking procurement as delivered"""
    delivery_date = serializers.DateTimeField(required=False)
    
    def validate_delivery_date(self, value):
        """Validate delivery date is not in future"""
        from django.utils import timezone
        if value and value > timezone.now():
            raise serializers.ValidationError("Delivery date cannot be in the future")
        return value


class JobMaterialSerializer(serializers.ModelSerializer):
    """Serializer for JobMaterial model"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_customer = serializers.CharField(source='job.customer_name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = JobMaterial
        fields = [
            'id', 'job', 'job_title', 'job_customer',
            'material', 'material_name', 'material_unit',
            'quantity_used', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_at', 'created_by']
    
    def validate_quantity_used(self, value):
        """Validate quantity used"""
        if value <= 0:
            raise serializers.ValidationError("Quantity used must be positive")
        return value


class JobMaterialCreateSerializer(serializers.Serializer):
    """Serializer for creating JobMaterial entries"""
    material = serializers.IntegerField()
    quantity_used = serializers.DecimalField(max_digits=12, decimal_places=4)
    
    def validate_material(self, value):
        """Validate material exists and is not archived"""
        try:
            material = Material.objects.get(id=value, archived=False)
            return material
        except Material.DoesNotExist:
            raise serializers.ValidationError("Material not found or archived")
    
    def validate_quantity_used(self, value):
        """Validate quantity used"""
        if value <= 0:
            raise serializers.ValidationError("Quantity used must be positive")
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for StockMovement model"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    quantity_changed = serializers.DecimalField(source='quantity', max_digits=12, decimal_places=4, read_only=True)
    balance_after = serializers.SerializerMethodField(read_only=True)
    reference = serializers.SerializerMethodField(read_only=True)
    notes = serializers.CharField(source='note', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'material', 'material_name', 'movement_type', 'quantity', 'quantity_changed',
            'balance_after', 'reference_type', 'reference_id', 'reference', 'note', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_balance_after(self, obj):
        """Get the material's current stock as balance after"""
        return float(obj.material.current_stock) if obj.material else 0
    
    def get_reference(self, obj):
        """Get a human-readable reference for the movement"""
        if obj.reference_type == 'procurement':
            return f"Procurement #{obj.reference_id}"
        elif obj.reference_type == 'job':
            return f"Job #{obj.reference_id}"
        elif obj.reference_type == 'adjustment':
            return "Manual Adjustment"
        elif obj.reference_type == 'material_usage':
            return f"Material Pickup #{obj.reference_id}"
        return obj.note or f"{obj.reference_type.title()} #{obj.reference_id}"


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for manual stock adjustments"""
    adjustment_quantity = serializers.DecimalField(max_digits=12, decimal_places=4)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_adjustment_quantity(self, value):
        """Validate adjustment quantity is not zero"""
        if value == 0:
            raise serializers.ValidationError("Adjustment quantity cannot be zero")
        return value


class MaterialStatsSerializer(serializers.Serializer):
    """Serializer for material statistics and summaries"""
    total_materials = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_movements_count = serializers.IntegerField()
    pending_procurements_count = serializers.IntegerField()


class CustomerContactSerializer(serializers.ModelSerializer):
    """Serializer for customer contact information (marketing database)"""
    can_receive_marketing = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CustomerContact
        fields = [
            'id', 'name', 'phone', 'opted_out', 'can_receive_marketing',
            'first_work_date', 'last_work_date', 'total_works', 'total_spent',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'first_work_date', 'last_work_date', 'total_works', 'total_spent', 'created_at', 'updated_at']
    
    def get_can_receive_marketing(self, obj):
        return obj.can_receive_marketing()


class MarketingMessageSerializer(serializers.ModelSerializer):
    """Serializer for marketing message templates"""
    created_by_name = serializers.SerializerMethodField(read_only=True)
    full_message = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = MarketingMessage
        fields = [
            'id', 'title', 'message', 'link_url', 'link_text',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'times_used', 'last_used',
            'full_message'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'times_used', 'last_used']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_full_message(self, obj):
        return obj.get_full_message()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""
    recipient_name = serializers.SerializerMethodField()
    work_order_title = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    procurement_id = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'notification_type',
            'title', 'message', 'work_order', 'work_order_title',
            'material', 'material_name', 'procurement', 'procurement_id',
            'is_read', 'read_at', 'created_at', 'time_ago'
        ]
        read_only_fields = ['recipient', 'created_at']
    
    def get_recipient_name(self, obj):
        if obj.recipient:
            return obj.recipient.get_full_name() or obj.recipient.username
        return None
    
    def get_work_order_title(self, obj):
        if obj.work_order:
            return obj.work_order.title
        return None
    
    def get_material_name(self, obj):
        if obj.material:
            return obj.material.name
        return None
    
    def get_procurement_id(self, obj):
        if obj.procurement:
            return obj.procurement.id
        return None
    
    def get_time_ago(self, obj):
        """Return human-readable time difference"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at)
