from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkViewSet, PaymentViewSet, JobCategoryViewSet, WorkFileViewSet,
    EmployeeProfileViewSet, UserViewSet, WorkerViewSet,
    DailySalesReportViewSet, DailySalesReportItemViewSet, SalesReportNoteViewSet, DailyExpenseViewSet,
    MaterialViewSet, ProcurementViewSet, JobMaterialViewSet, StockMovementViewSet, MaterialUsageViewSet,
    CustomerContactViewSet, MarketingMessageViewSet,
    daily_summary, work_statistics, sales_report_summary
)
from .views import AdminDashboardView

router = DefaultRouter()
router.register(r'works', WorkViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'job-categories', JobCategoryViewSet)
router.register(r'work-files', WorkFileViewSet)
router.register(r'employees', EmployeeProfileViewSet)
router.register(r'workers', WorkerViewSet, basename='worker')
router.register(r'users', UserViewSet, basename="user")
router.register(r'sales-reports', DailySalesReportViewSet, basename='sales-report')
router.register(r'sales-report-items', DailySalesReportItemViewSet, basename='sales-report-item')
router.register(r'sales-report-notes', SalesReportNoteViewSet, basename='sales-report-note')
router.register(r'daily-expenses', DailyExpenseViewSet, basename='daily-expense')

# Procurement & Inventory endpoints
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'procurements', ProcurementViewSet, basename='procurement')
router.register(r'job-materials', JobMaterialViewSet, basename='job-material')
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movement')
router.register(r'material-usage', MaterialUsageViewSet, basename='material-usage')

# Customer Contacts & Marketing endpoints
router.register(r'customer-contacts', CustomerContactViewSet, basename='customer-contact')
router.register(r'marketing-messages', MarketingMessageViewSet, basename='marketing-message')

urlpatterns = [
    path('', include(router.urls)),
    path('admin-dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('summary/daily/', daily_summary, name='daily-summary'),
    path('summary/sales-reports/', sales_report_summary, name='sales-report-summary'),
    path('statistics/works/', work_statistics, name='work-statistics'),
]
