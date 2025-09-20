from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(Customer)
admin.site.register(Work)
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = ('id', 'work', 'amount', 'paid_at', 'processed_by')
	readonly_fields = ('paid_at',)


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'position', 'joined_at')