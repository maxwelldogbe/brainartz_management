from django.contrib import admin
from .models import (
    Work, Payment, EmployeeProfile, JobCategory, WorkFile,
    DailySalesReport, DailySalesReportItem, SalesReportNote, DailyExpense,
    Material, PendingStockAdjustment, Procurement, JobMaterial, StockMovement, CustomerContact,
    MarketingMessage
)


@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'color', 'is_active', 'works_count', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at', 'created_by')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'works_count')
    
    def works_count(self, obj):
        return obj.works.count()
    works_count.short_description = 'Number of Works'


@admin.register(Work)
class WorkAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer_name', 'customer_phone', 'category', 'price', 'is_credit', 'credit_cleared', 'worker', 'completed', 'created_at')
    list_filter = ('completed', 'is_credit', 'credit_cleared', 'category', 'created_at', 'worker')
    search_fields = ('title', 'description', 'customer_name', 'customer_phone')
    readonly_fields = ('created_at', 'completed_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer_name', 'customer_phone', 'title', 'description', 'category')
        }),
        ('Assignment & Pricing', {
            'fields': ('worker', 'price')
        }),
        ('Credit', {
            'fields': ('is_credit', 'credit_cleared', 'credit_cleared_at')
        }),
        ('Status', {
            'fields': ('completed', 'completed_at', 'note')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )


@admin.register(WorkFile)
class WorkFileAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'work', 'file_type', 'file_size_display', 'uploaded_by', 'uploaded_at')
    list_filter = ('file_type', 'uploaded_at', 'uploaded_by')
    search_fields = ('original_name', 'work__title', 'work__customer_name')
    readonly_fields = ('uploaded_at', 'file_size_display', 'original_name', 'file_type', 'file_size')
    
    def file_size_display(self, obj):
        return obj.get_file_size_display()
    file_size_display.short_description = 'File Size'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'work', 'amount', 'method', 'paid_at', 'processed_by')
    list_filter = ('method', 'paid_at', 'processed_by')
    search_fields = ('work__title', 'work__customer_name', 'tracking_number')
    readonly_fields = ('paid_at',)


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'joined_at')
    list_filter = ('position', 'joined_at')
    search_fields = ('user__username', 'user__email', 'position')
    readonly_fields = ('joined_at',)


class DailySalesReportItemInline(admin.TabularInline):
    model = DailySalesReportItem
    extra = 0
    readonly_fields = ('outstanding_amount',)


class DailyExpenseInline(admin.TabularInline):
    model = DailyExpense
    extra = 0
    readonly_fields = ('recorded_by', 'recorded_at')


class SalesReportNoteInline(admin.TabularInline):
    model = SalesReportNote
    extra = 0
    readonly_fields = ('added_by', 'created_at')


@admin.register(DailySalesReport)
class DailySalesReportAdmin(admin.ModelAdmin):
    list_display = (
        'date', 'generated_by', 'approval_status', 'is_submitted', 'approved_by',
        'total_sales_amount', 'total_payments_received', 'net_total', 'created_at'
    )
    list_filter = ('approval_status', 'is_submitted', 'date', 'generated_by', 'created_at')
    search_fields = ('generated_by__username', 'generated_by__email')
    readonly_fields = (
        'created_at', 'updated_at', 'submitted_at', 'approved_at',
        'total_sales_amount', 'total_payments_received', 'total_outstanding', 'total_expenses', 'net_total'
    )
    inlines = [DailySalesReportItemInline, DailyExpenseInline, SalesReportNoteInline]
    
    fieldsets = (
        ('Report Information', {
            'fields': ('date', 'generated_by', 'approval_status', 'is_submitted', 'submitted_at', 'approved_by', 'approved_at')
        }),
        ('Calculated Totals', {
            'fields': ('total_sales_amount', 'total_payments_received', 'total_outstanding', 'total_expenses', 'net_total'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.generated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DailySalesReportItem)
class DailySalesReportItemAdmin(admin.ModelAdmin):
    list_display = ('report', 'category', 'total_works', 'total_amount', 'payments_received', 'outstanding_amount')
    list_filter = ('category', 'report__date', 'report__generated_by')
    search_fields = ('category__name', 'report__generated_by__username')
    readonly_fields = ('outstanding_amount',)


@admin.register(SalesReportNote)
class SalesReportNoteAdmin(admin.ModelAdmin):
    list_display = ('report', 'added_by', 'note_preview', 'created_at')
    list_filter = ('created_at', 'added_by', 'report__date')
    search_fields = ('note', 'added_by__username', 'report__generated_by__username')
    readonly_fields = ('created_at',)
    
    def note_preview(self, obj):
        return obj.note[:50] + '...' if len(obj.note) > 50 else obj.note
    note_preview.short_description = 'Note Preview'


@admin.register(DailyExpense)
class DailyExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'category', 'report', 'recorded_by', 'recorded_at')
    list_filter = ('category', 'recorded_at', 'recorded_by', 'report__date')
    search_fields = ('description', 'receipt_number', 'recorded_by__username')
    readonly_fields = ('recorded_at',)
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)


# ============ PROCUREMENT & INVENTORY ADMIN ============

class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0
    readonly_fields = ('movement_type', 'quantity', 'reference_type', 'reference_id', 'note', 'created_at')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False  # Stock movements should only be created programmatically


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'unit', 'current_stock', 'reorder_level', 'is_low_stock', 'archived', 'created_at')
    list_filter = ('category', 'archived', 'created_at')
    search_fields = ('name', 'unit')
    readonly_fields = ('created_at', 'updated_at', 'is_low_stock')
    inlines = [StockMovementInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'unit')
        }),
        ('Stock Information', {
            'fields': ('current_stock', 'reorder_level', 'is_low_stock')
        }),
        ('Status', {
            'fields': ('archived',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def is_low_stock(self, obj):
        return obj.is_low_stock()
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock'


@admin.register(PendingStockAdjustment)
class PendingStockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('get_material_display', 'quantity', 'adjustment_type', 'status', 'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'adjustment_type', 'submitted_at', 'reviewed_at', 'submitted_by')
    search_fields = ('material__name', 'material_name', 'reason', 'submitted_by__username', 'reviewed_by__username')
    readonly_fields = ('submitted_by', 'reviewed_by', 'submitted_at', 'reviewed_at', 'get_material_display')

    fieldsets = (
        ('Request Information', {
            'fields': ('adjustment_type', 'get_material_display', 'material', 'quantity', 'reason')
        }),
        ('New Material Details (if applicable)', {
            'fields': ('material_name', 'material_category', 'material_unit', 'reorder_level'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'rejection_reason')
        }),
        ('Approval Details', {
            'fields': ('submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at'),
            'classes': ('collapse',)
        })
    )

    def get_material_display(self, obj):
        return obj.get_display_name()
    get_material_display.short_description = 'Material'

    def has_add_permission(self, request):
        return False  # Staff should use API to submit, not admin


@admin.register(Procurement)
class ProcurementAdmin(admin.ModelAdmin):
    list_display = ('id', 'material', 'quantity_ordered', 'unit_cost', 'total_cost', 'status', 'order_date', 'delivery_date')
    list_filter = ('status', 'order_date', 'delivery_date', 'material__category', 'created_by')
    search_fields = ('material__name',)
    readonly_fields = ('total_cost', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Material', {
            'fields': ('material',)
        }),
        ('Order Details', {
            'fields': ('quantity_ordered', 'unit_cost', 'total_cost', 'status')
        }),
        ('Dates', {
            'fields': ('order_date', 'delivery_date')
        }),
        ('Tracking', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(JobMaterial)
class JobMaterialAdmin(admin.ModelAdmin):
    list_display = ('job', 'material', 'quantity_used', 'created_by', 'created_at')
    list_filter = ('material__category', 'created_at', 'created_by')
    search_fields = ('job__title', 'job__customer_name', 'material__name')
    readonly_fields = ('created_at',)
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('material', 'movement_type', 'quantity', 'reference_type', 'reference_id', 'created_at')
    list_filter = ('movement_type', 'reference_type', 'created_at', 'material__category')
    search_fields = ('material__name', 'note')
    readonly_fields = ('created_at',)
    
    def has_add_permission(self, request):
        return False  # Stock movements should only be created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Stock movements are immutable
    
    def has_delete_permission(self, request, obj=None):
        return False  # Stock movements should not be deleted


@admin.register(CustomerContact)
class CustomerContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'total_works', 'total_spent', 'opted_out', 'last_work_date', 'can_receive_marketing')
    list_filter = ('opted_out', 'first_work_date', 'last_work_date')
    search_fields = ('name', 'phone', 'notes')
    readonly_fields = ('first_work_date', 'last_work_date', 'total_works', 'total_spent', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('name', 'phone')
        }),
        ('Marketing Preferences', {
            'fields': ('opted_out',)
        }),
        ('Statistics', {
            'fields': ('total_works', 'total_spent', 'first_work_date', 'last_work_date'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def can_receive_marketing(self, obj):
        return obj.can_receive_marketing()
    can_receive_marketing.boolean = True
    can_receive_marketing.short_description = 'Can Receive Marketing'


@admin.register(MarketingMessage)
class MarketingMessageAdmin(admin.ModelAdmin):
    list_display = ('title', 'message_preview', 'has_link', 'is_active', 'times_used', 'last_used', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at', 'last_used')
    search_fields = ('title', 'message', 'link_url')
    readonly_fields = ('created_by', 'created_at', 'updated_at', 'times_used', 'last_used', 'full_message_preview')
    
    fieldsets = (
        ('Message Information', {
            'fields': ('title', 'message', 'is_active')
        }),
        ('Link (Optional)', {
            'fields': ('link_url', 'link_text')
        }),
        ('Preview', {
            'fields': ('full_message_preview',),
            'description': 'This is how the message will appear to customers'
        }),
        ('Usage Statistics', {
            'fields': ('times_used', 'last_used'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'
    
    def has_link(self, obj):
        return bool(obj.link_url)
    has_link.boolean = True
    has_link.short_description = 'Has Link'
    
    def full_message_preview(self, obj):
        return obj.get_full_message()
    full_message_preview.short_description = 'Full Message Preview'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
