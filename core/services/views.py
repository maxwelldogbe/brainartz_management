from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from .models import Customer, Work, Payment, EmployeeProfile
from .serializers import (
    CustomerSerializer, WorkSerializer, PaymentSerializer,
    EmployeeProfileSerializer, UserActivitySerializer
)
from .permissions import IsOwnerOrAdminForUnsafeMethods
from rest_framework import permissions as drf_permissions
from .serializers import WorkerSerializer

User = get_user_model()


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def perform_create(self, serializer):
        user = self.request.user if self.request and self.request.user and self.request.user.is_authenticated else None
        if user is not None:
            serializer.save(creator=user)
        else:
            serializer.save()


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = WorkSerializer
    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def perform_create(self, serializer):
        # set the worker to request.user if they are authenticated and marked as worker
        user = self.request.user if self.request and self.request.user and self.request.user.is_authenticated else None
        if user is not None:
            serializer.save(worker=user)
        else:
            serializer.save()


class PaymentViewSet(viewsets.ModelViewSet):
    """Payments: processed_by is set automatically. Non-staff users cannot update or delete payments.

    If an employee makes an error, they should create another Payment with a `note` explaining corrections.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def perform_create(self, serializer):
        # tie payment to the employee creating the record
        user = self.request.user if self.request and self.request.user and self.request.user.is_authenticated else None
        # if amount not provided or falsy, try to default from work price
        data = serializer.validated_data if hasattr(serializer, 'validated_data') else {}
        amount = data.get('amount')
        work = data.get('work')
        if (not amount or float(amount) == 0) and work is not None:
            try:
                serializer.save(processed_by=user, amount=work.price)
                return
            except Exception:
                pass

        serializer.save(processed_by=user)


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer


class WorkerViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only list of workers (users with is_worker=True)."""
    queryset = User.objects.filter(is_worker=True)
    serializer_class = WorkerSerializer
    permission_classes = [drf_permissions.IsAdminUser]


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """For listing users and fetching activity per user."""
    queryset = User.objects.all()
    serializer_class = UserActivitySerializer

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        """Custom endpoint to fetch all works & payments tied to this user."""
        user = self.get_object()
        serializer = UserActivitySerializer(user)
        return Response(serializer.data)


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # aggregated stats for admin dashboard
        total_customers = Customer.objects.count()
        total_works = Work.objects.count()
        total_payments = Payment.objects.count()
        total_revenue = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
        payments_by_employee = (
            User.objects.filter(payments_processed__isnull=False)
            .annotate(payments_count=Count('payments_processed'), payments_total=Sum('payments_processed__amount'))
            .values('id', 'email', 'payments_count', 'payments_total')
        )

        data = {
            'total_customers': total_customers,
            'total_works': total_works,
            'total_payments': total_payments,
            'total_revenue': total_revenue,
            'payments_by_employee': list(payments_by_employee),
        }
        return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def daily_summary(request):
    # minimal daily summary implementation
    from django.utils import timezone
    today = timezone.localdate()
    total_works_done = Work.objects.filter(created_at__date=today, completed=True).count()
    incomplete_works = Work.objects.filter(completed=False).count()
    revenue_today = Payment.objects.filter(paid_at__date=today).aggregate(total=Sum('amount'))['total'] or 0
    return Response({
        'date': str(today),
        'total_works_done': total_works_done,
        'incomplete_works': incomplete_works,
        'revenue_today': revenue_today,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_summary(request):
    # return simple list of customers and their works count
    data = Customer.objects.all().values('id', 'name').annotate(works_count=Count('works'))
    return Response(list(data))
