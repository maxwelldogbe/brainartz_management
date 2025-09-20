from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, WorkViewSet, PaymentViewSet,
    EmployeeProfileViewSet, UserViewSet,
    daily_summary, customer_summary
)
from .views import AdminDashboardView
from .views import WorkerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'works', WorkViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'employees', EmployeeProfileViewSet)
router.register(r'workers', WorkerViewSet, basename='worker')
router.register(r'users', UserViewSet, basename="user")

urlpatterns = [
    path('', include(router.urls)),
    path('admin-dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('summary/daily/', daily_summary, name='daily-summary'),
    path('summary/customers/', customer_summary, name='customer-summary'),
]
