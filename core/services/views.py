from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from .models import (
    Work, Payment, EmployeeProfile, JobCategory, WorkFile,
    DailySalesReport, DailySalesReportItem, SalesReportNote, DailyExpense,
    Material, PendingStockAdjustment, Procurement, JobMaterial, StockMovement, MaterialUsage,
    CustomerContact, MarketingMessage, Notification
)
from .serializers import (
    WorkSerializer, PaymentSerializer, EmployeeProfileSerializer, 
    JobCategorySerializer, WorkFileSerializer, WorkCreateSerializer, WorkFileUploadSerializer,
    UserActivitySerializer, JobCategorySelectSerializer, WorkSelectSerializer,
    DailySalesReportSerializer, DailySalesReportCreateSerializer, DailySalesReportItemSerializer,
    SalesReportNoteSerializer, DailyExpenseSerializer,
    MaterialSerializer, PendingStockAdjustmentSerializer, ProcurementSerializer, ProcurementDeliverySerializer,
    JobMaterialSerializer, JobMaterialCreateSerializer, StockMovementSerializer,
    StockAdjustmentSerializer, MaterialStatsSerializer, MaterialUsageSerializer,
    CustomerContactSerializer, MarketingMessageSerializer, NotificationSerializer
)
from .permissions import (
    IsOwnerOrAdminForUnsafeMethods, IsManagerOrStaffReadOnly, 
    IsProcurementManager, IsStockManager
)
from .procurement_services import ProcurementService
from rest_framework import permissions as drf_permissions
from .serializers import WorkerSerializer

User = get_user_model()


class JobCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing job categories"""
    queryset = JobCategory.objects.filter(is_active=True)
    serializer_class = JobCategorySerializer
    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def perform_create(self, serializer):
        user = self.request.user if self.request and self.request.user and self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=False, methods=['get'])
    def select_options(self, request):
        """Lightweight endpoint for category dropdown options"""
        categories = JobCategory.objects.filter(is_active=True)
        serializer = JobCategorySelectSerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of a category"""
        try:
            category = self.get_object()
            category.is_active = not category.is_active
            category.save()
            serializer = JobCategorySerializer(category)
            return Response(serializer.data)
        except JobCategory.DoesNotExist:
            return Response({'error': 'Category not found'}, status=404)


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all().select_related('category', 'worker').prefetch_related('files')
    serializer_class = WorkSerializer
    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkCreateSerializer
        return WorkSerializer

    def perform_create(self, serializer):
        # Set the worker to request.user if they are authenticated and marked as worker
        user = self.request.user if self.request and self.request.user and self.request.user.is_authenticated else None
        
        # Extract payment-related fields before saving
        mark_as_paid = serializer.validated_data.pop('mark_as_paid', False)
        payment_method = serializer.validated_data.pop('payment_method', None)
        payment_tracking_number = serializer.validated_data.pop('payment_tracking_number', None)
        payment_note = serializer.validated_data.pop('payment_note', None)
        
        # Save the work
        if user is not None:
            work = serializer.save(worker=user)
        else:
            work = serializer.save()
        
        # Create payment if mark_as_paid is True
        if mark_as_paid and payment_method:
            Payment.objects.create(
                work=work,
                amount=work.price,
                method=payment_method,
                tracking_number=payment_tracking_number or '',
                note=payment_note or 'Payment recorded at work creation',
                processed_by=user
            )

    @action(detail=False, methods=['get'])
    def select_options(self, request):
        """Lightweight endpoint for work dropdown options - excludes fully paid works by default"""
        from django.db.models import Sum, Case, When, DecimalField, F
        
        # Check if we should include fully paid works (admin use case)
        include_fully_paid = request.query_params.get('include_fully_paid', '').lower() in ['true', '1', 'yes']
        
        # Get all works with payment totals calculated
        works = Work.objects.annotate(
            total_payments=Case(
                When(payments__isnull=True, then=0),
                default=Sum('payments__amount'),
                output_field=DecimalField()
            )
        )
        
        # Exclude fully paid works unless explicitly requested
        if not include_fully_paid:
            works = works.exclude(total_payments__gte=F('price'))
        
        serializer = WorkSelectSerializer(works, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get works grouped by category"""
        category_id = request.query_params.get('category_id')
        if category_id:
            works = Work.objects.filter(category_id=category_id)
        else:
            works = Work.objects.all()
        
        serializer = WorkSerializer(works, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending/incomplete works"""
        works = Work.objects.filter(completed=False).select_related('category', 'worker')
        serializer = WorkSerializer(works, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unpaid_works(self, request):
        """Get all works with outstanding payments for payment processing"""
        from django.db.models import Sum, Case, When, DecimalField, F
        
        # Get works where total payments < work price (or no payments at all)
        works = Work.objects.select_related('category').annotate(
            total_payments=Case(
                When(payments__isnull=True, then=0),
                default=Sum('payments__amount'),
                output_field=DecimalField()
            )
        ).filter(
            total_payments__lt=F('price')
        )
        
        serializer = WorkSelectSerializer(works, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark work as completed"""
        try:
            work = self.get_object()
            work.completed = True
            work.save()  # This will auto-set completed_at due to model save method
            serializer = WorkSerializer(work, context={'request': request})
            return Response(serializer.data)
        except Work.DoesNotExist:
            return Response({'error': 'Work not found'}, status=404)

    @action(detail=True, methods=['post'])
    def reopen_work(self, request, pk=None):
        """Reopen a completed work for corrections"""
        try:
            work = self.get_object()
            work.completed = False
            work.save()  # This will auto-set completed_at to None due to model save method
            serializer = WorkSerializer(work, context={'request': request})
            return Response(serializer.data)
        except Work.DoesNotExist:
            return Response({'error': 'Work not found'}, status=404)

    @action(detail=True, methods=['post'])
    def assign_worker(self, request, pk=None):
        """Assign work to a worker"""
        try:
            work = self.get_object()
            worker_id = request.data.get('worker_id')
            
            if worker_id:
                try:
                    worker = User.objects.get(id=worker_id, is_worker=True)
                    work.worker = worker
                    work.save()
                    serializer = WorkSerializer(work, context={'request': request})
                    return Response(serializer.data)
                except User.DoesNotExist:
                    return Response({'error': 'Worker not found'}, status=404)
            else:
                # Unassign worker
                work.worker = None
                work.save()
                serializer = WorkSerializer(work, context={'request': request})
                return Response(serializer.data)
                
        except Work.DoesNotExist:
            return Response({'error': 'Work not found'}, status=404)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def record_material_usage(self, request, pk=None):
        """Record materials used for this job/work"""
        work = self.get_object()
        serializer = JobMaterialCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                result = ProcurementService.record_job_material_usage(
                    job_id=work.id,
                    material_id=serializer.validated_data['material'].id,
                    quantity_used=serializer.validated_data['quantity_used'],
                    user=request.user
                )
                return Response(result, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        """Get materials used for this job/work"""
        work = self.get_object()
        job_materials = work.job_materials.select_related('material', 'created_by')
        serializer = JobMaterialSerializer(job_materials, many=True, context={'request': request})
        return Response(serializer.data)


class WorkFileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing work file attachments"""
    queryset = WorkFile.objects.all()
    serializer_class = WorkFileSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsOwnerOrAdminForUnsafeMethods]

    def get_queryset(self):
        # Filter by work if work_id is provided
        work_id = self.request.query_params.get('work_id')
        if work_id:
            return WorkFile.objects.filter(work_id=work_id)
        return WorkFile.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkFileUploadSerializer
        return WorkFileSerializer

    def create(self, request, *args, **kwargs):
        work_id = request.data.get('work_id')
        
        if not work_id:
            return Response({'error': 'work_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            work = Work.objects.get(id=work_id)
        except Work.DoesNotExist:
            return Response({'error': 'Work not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save with work and uploaded_by
        file_instance = serializer.save(
            work=work,
            uploaded_by=request.user if request.user.is_authenticated else None
        )
        
        # Return full file details
        response_serializer = WorkFileSerializer(file_instance, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Upload multiple files at once"""
        work_id = request.data.get('work_id')
        files = request.FILES.getlist('files')
        
        if not work_id:
            return Response({'error': 'work_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not files:
            return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            work = Work.objects.get(id=work_id)
        except Work.DoesNotExist:
            return Response({'error': 'Work not found'}, status=status.HTTP_404_NOT_FOUND)

        uploaded_files = []
        errors = []

        for file_obj in files:
            serializer = WorkFileUploadSerializer(data={'file': file_obj})
            if serializer.is_valid():
                file_instance = serializer.save(
                    work=work,
                    uploaded_by=request.user if request.user.is_authenticated else None
                )
                uploaded_files.append(file_instance)
            else:
                errors.append({
                    'file': file_obj.name,
                    'errors': serializer.errors
                })

        # Prepare response
        response_data = {
            'uploaded': WorkFileSerializer(uploaded_files, many=True, context={'request': request}).data,
            'errors': errors
        }

        if errors:
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        else:
            return Response(response_data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ModelViewSet):
    """Payments: processed_by is set automatically. Non-staff users cannot update or delete payments.

    If an employee makes an error, they should create another Payment with a `note` explaining corrections.
    """
    queryset = Payment.objects.all().select_related('work')
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
        serializer = UserActivitySerializer(user, context={'request': request})
        return Response(serializer.data)


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Enhanced aggregated stats for admin dashboard
        # Customer count removed - customer info now part of Work model
        total_works = Work.objects.count()
        completed_works = Work.objects.filter(completed=True).count()
        pending_works = Work.objects.filter(completed=False).count()
        total_payment_transactions = Payment.objects.count()  # Renamed for clarity
        total_revenue = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
        total_categories = JobCategory.objects.filter(is_active=True).count()
        
        # Works by category
        works_by_category = (
            JobCategory.objects.filter(is_active=True)
            .annotate(works_count=Count('works'))
            .values('id', 'name', 'color', 'works_count')
        )
        
        # Payments by employee
        payments_by_employee = (
            User.objects.filter(payments_processed__isnull=False)
            .annotate(payments_count=Count('payments_processed'), payments_total=Sum('payments_processed__amount'))
            .values('id', 'username', 'email', 'payments_count', 'payments_total')
        )

        # Works by employee
        works_by_employee = (
            User.objects.filter(works_done__isnull=False)
            .annotate(works_count=Count('works_done'), completed_works=Count('works_done', filter=Q(works_done__completed=True)))
            .values('id', 'username', 'email', 'works_count', 'completed_works')
        )

        # Count unique customers from works
        unique_customers = Work.objects.values('customer_name').distinct().count()
        
        data = {
            'total_customers': unique_customers,  # Count of unique customer names from works
            'total_works': total_works,
            'completed_works': completed_works,
            'pending_works': pending_works,
            'total_payment_transactions': total_payment_transactions,  # Clear field name
            'total_payments': total_payment_transactions,  # Keep for backward compatibility
            'total_revenue': total_revenue,
            'total_categories': total_categories,
            'works_by_category': list(works_by_category),
            'payments_by_employee': list(payments_by_employee),
            'works_by_employee': list(works_by_employee),
        }
        return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def daily_summary(request):
    # Enhanced daily summary implementation
    from django.utils import timezone
    today = timezone.localdate()
    
    total_works_done = Work.objects.filter(created_at__date=today, completed=True).count()
    incomplete_works = Work.objects.filter(completed=False).count()
    new_works_today = Work.objects.filter(created_at__date=today).count()
    
    # Revenue for works CREATED today only (not all payments made today)
    works_created_today = Work.objects.filter(created_at__date=today)
    revenue_today = Payment.objects.filter(work__in=works_created_today).aggregate(total=Sum('amount'))['total'] or 0
    
    files_uploaded_today = WorkFile.objects.filter(uploaded_at__date=today).count()
    
    # Count unique customers with works today
    customers_today = Work.objects.filter(created_at__date=today).values('customer_name').distinct().count()
    
    # Calculate total revenue (all-time) and monthly revenue
    total_revenue_all_time = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
    
    # Calculate this month's revenue (for works CREATED this month, not payments made this month)
    month_start = today.replace(day=1)
    works_created_this_month = Work.objects.filter(
        created_at__date__gte=month_start,
        created_at__date__lte=today
    )
    revenue_this_month = Payment.objects.filter(work__in=works_created_this_month).aggregate(total=Sum('amount'))['total'] or 0
    
    return Response({
        'date': str(today),
        'total_works_done': total_works_done,
        'incomplete_works': incomplete_works,
        'new_works_today': new_works_today,
        'revenue_today': float(revenue_today),
        'files_uploaded_today': files_uploaded_today,
        # Additional fields for WorkAnalytics compatibility
        'works_count': new_works_today,
        'total_revenue': float(total_revenue_all_time),
        'revenue_this_month': float(revenue_this_month),
        'customers_count': customers_today,
    })


# Customer summary removed - Customer model no longer exists
# Customer info is now stored directly on Work model (customer_name, customer_phone)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def work_statistics(request):
    """Get work statistics by category and status"""
    # Works by category
    category_stats = (
        JobCategory.objects.filter(is_active=True)
        .annotate(
            total_works=Count('works'),
            completed_works=Count('works', filter=Q(works__completed=True)),
            pending_works=Count('works', filter=Q(works__completed=False)),
            total_revenue=Sum('works__payments__amount')
        )
        .values('id', 'name', 'color', 'total_works', 'completed_works', 'pending_works', 'total_revenue')
    )
    
    # Overall statistics
    total_works = Work.objects.count()
    completed_works = Work.objects.filter(completed=True).count()
    pending_works = Work.objects.filter(completed=False).count()
    
    return Response({
        'overall': {
            'total_works': total_works,
            'completed_works': completed_works,
            'pending_works': pending_works,
            'completion_rate': (completed_works / total_works * 100) if total_works > 0 else 0
        },
        'by_category': list(category_stats)
    })


class DailySalesReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing daily sales reports"""
    serializer_class = DailySalesReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            # Admins can see all reports
            return DailySalesReport.objects.all().prefetch_related(
                'report_items__category', 'expenses', 'notes__added_by'
            )
        else:
            # Employees can only see their own reports
            return DailySalesReport.objects.filter(generated_by=user).prefetch_related(
                'report_items__category', 'expenses', 'notes__added_by'
            )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DailySalesReportCreateSerializer
        return DailySalesReportSerializer
    
    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Override update to check edit permissions"""
        instance = self.get_object()
        if not instance.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot edit this report. Only admins can edit submitted reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to check edit permissions"""
        instance = self.get_object()
        if not instance.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot edit this report. Only admins can edit submitted reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a sales report (locks it for editing by non-admins)"""
        report = self.get_object()
        
        if report.is_submitted:
            return Response(
                {'error': 'Report is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not report.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot submit this report'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report.submit_report()
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def generate_from_works(self, request, pk=None):
        """Automatically generate report items from works for the day"""
        report = self.get_object()
        
        if not report.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot edit this report'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all works for the report date
        works_for_date = Work.objects.filter(created_at__date=report.date)
        
        # Group by category
        category_data = {}
        for work in works_for_date:
            category = work.category or JobCategory.objects.get_or_create(
                name='Uncategorized', defaults={'description': 'Default category for uncategorized works'}
            )[0]
            
            if category.id not in category_data:
                category_data[category.id] = {
                    'category': category,
                    'total_works': 0,
                    'total_amount': 0,
                    'payments_received': 0
                }
            
            category_data[category.id]['total_works'] += 1
            category_data[category.id]['total_amount'] += work.price
            
            # Calculate payments received for this work
            payments = Payment.objects.filter(
                work=work, 
                paid_at__date=report.date
            ).aggregate(total=Sum('amount'))['total'] or 0
            category_data[category.id]['payments_received'] += payments
        
        # Create or update report items
        for category_id, data in category_data.items():
            report_item, created = DailySalesReportItem.objects.update_or_create(
                report=report,
                category=data['category'],
                defaults={
                    'total_works': data['total_works'],
                    'total_amount': data['total_amount'],
                    'payments_received': data['payments_received']
                }
            )
        
        # Recalculate report totals
        report.calculate_totals()
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """Get reports within a date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class DailySalesReportItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing sales report items (category breakdowns)"""
    serializer_class = DailySalesReportItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        report_id = self.request.query_params.get('report_id')
        if report_id:
            return DailySalesReportItem.objects.filter(report_id=report_id)
        return DailySalesReportItem.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create a new report item"""
        report_id = request.data.get('report_id')
        
        if not report_id:
            return Response(
                {'error': 'report_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            report = DailySalesReport.objects.get(id=report_id)
        except DailySalesReport.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not report.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot edit this report'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report_item = serializer.save(report=report)
        
        # Recalculate report totals
        report.calculate_totals()
        report.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SalesReportNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing sales report notes"""
    serializer_class = SalesReportNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        report_id = self.request.query_params.get('report_id')
        if report_id:
            return SalesReportNote.objects.filter(report_id=report_id)
        return SalesReportNote.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create a new note for a sales report"""
        report_id = request.data.get('report_id')
        
        if not report_id:
            return Response(
                {'error': 'report_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            report = DailySalesReport.objects.get(id=report_id)
        except DailySalesReport.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(report=report, added_by=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DailyExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing daily expenses"""
    serializer_class = DailyExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        report_id = self.request.query_params.get('report_id')
        if report_id:
            return DailyExpense.objects.filter(report_id=report_id)
        return DailyExpense.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create a new expense for a sales report"""
        report_id = request.data.get('report_id')
        
        if not report_id:
            return Response(
                {'error': 'report_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            report = DailySalesReport.objects.get(id=report_id)
        except DailySalesReport.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not report.can_be_edited_by(request.user):
            return Response(
                {'error': 'You cannot edit this report'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save(report=report, recorded_by=request.user)
        
        # Recalculate report totals
        report.calculate_totals()
        report.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sales_report_summary(request):
    """Get summary statistics for sales reports"""
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.localdate()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    user = request.user
    base_queryset = DailySalesReport.objects.all()
    
    if not user.is_admin:
        base_queryset = base_queryset.filter(generated_by=user)
    
    # Calculate totals
    total_reports = base_queryset.count()
    submitted_reports = base_queryset.filter(is_submitted=True).count()
    draft_reports = total_reports - submitted_reports
    
    # Monthly totals
    monthly_reports = base_queryset.filter(date__gte=month_ago)
    total_sales_this_month = monthly_reports.aggregate(total=Sum('total_sales_amount'))['total'] or 0
    total_revenue_this_month = monthly_reports.aggregate(total=Sum('total_payments_received'))['total'] or 0
    total_expenses_this_month = monthly_reports.aggregate(total=Sum('total_expenses'))['total'] or 0
    total_outstanding_this_month = monthly_reports.aggregate(total=Sum('total_outstanding'))['total'] or 0
    
    # Recent reports
    recent_reports = base_queryset.order_by('-date')[:5]
    recent_serializer = DailySalesReportSerializer(recent_reports, many=True, context={'request': request})
    
    # Return data in the format expected by frontend
    return Response({
        'total_reports': total_reports,
        'submitted_reports': submitted_reports,
        'draft_reports': draft_reports,
        'reports_this_week': base_queryset.filter(date__gte=week_ago).count(),
        'reports_this_month': monthly_reports.count(),
        'total_sales_this_month': total_sales_this_month,
        'total_revenue_this_month': total_revenue_this_month,
        'total_revenue': total_revenue_this_month,  # Frontend expects this field
        'total_expenses_this_month': total_expenses_this_month,
        'total_outstanding_this_month': total_outstanding_this_month,
        'total_outstanding': total_outstanding_this_month,  # Frontend expects this field
        'statistics': {
            'total_reports': total_reports,
            'submitted_reports': submitted_reports,
            'reports_this_week': base_queryset.filter(date__gte=week_ago).count(),
            'reports_this_month': monthly_reports.count(),
            'total_sales_this_month': total_sales_this_month,
            'total_revenue_this_month': total_revenue_this_month,
            'total_expenses_this_month': total_expenses_this_month,
        },
        'recent_reports': recent_serializer.data
    })


# ============ PROCUREMENT & INVENTORY VIEWS ============

class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for managing materials"""
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsManagerOrStaffReadOnly]
    
    def get_queryset(self):
        """Filter materials based on query parameters"""
        queryset = Material.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by archived status
        archived = self.request.query_params.get('archived')
        if archived is not None:
            queryset = queryset.filter(archived=archived.lower() == 'true')
        else:
            # Default to non-archived materials only
            queryset = queryset.filter(archived=False)
        
        # Filter for low stock materials
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'))
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('name')
    
    def get_serializer_context(self):
        """Add context for serializer"""
        context = super().get_serializer_context()
        context['include_movements'] = self.request.query_params.get('include_movements') == 'true'
        return context
    
    @action(detail=True, methods=['post'], permission_classes=[IsStockManager])
    def adjust_stock(self, request, pk=None):
        """Manually adjust material stock (Manager only)"""
        material = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                result = ProcurementService.adjust_material_stock(
                    material_id=material.id,
                    adjustment_quantity=serializer.validated_data['adjustment_quantity'],
                    note=serializer.validated_data.get('note', ''),
                    user=request.user
                )
                return Response(result, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get material statistics"""
        from django.db.models import F, Sum, Count, Q
        from django.utils import timezone
        from datetime import timedelta
        
        # Basic material statistics
        total_materials = Material.objects.filter(archived=False).count()
        low_stock_count = Material.objects.filter(
            archived=False,
            current_stock__lte=F('reorder_level')
        ).count()
        out_of_stock_count = Material.objects.filter(
            archived=False,
            current_stock=0
        ).count()
        
        # Total stock value (we'll calculate without unit cost for now)
        # Since Material model doesn't have unit_cost, we'll use 0 or get from procurements
        total_stock_value = 0  # Would need unit cost field or procurement data
        
        # Recent movements count (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_movements_count = StockMovement.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        # Category breakdown
        category_stats = Material.objects.filter(archived=False).values('category').annotate(
            count=Count('id'),
            total_stock=Sum('current_stock'),
            low_stock_items=Count('id', filter=Q(current_stock__lte=F('reorder_level')))
        ).order_by('-count')
        
        stats = {
            'total_materials': total_materials,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'total_stock_value': float(total_stock_value),
            'recent_movements_count': recent_movements_count,
            'category_breakdown': list(category_stats)
        }
        
        return Response(stats)


class PendingStockAdjustmentViewSet(viewsets.ModelViewSet):
    """ViewSet for staff stock addition requests pending admin approval"""
    serializer_class = PendingStockAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Admins see all, staff see only their own"""
        if self.request.user.is_admin:
            return PendingStockAdjustment.objects.select_related('material', 'submitted_by', 'reviewed_by').all()
        return PendingStockAdjustment.objects.filter(submitted_by=self.request.user).select_related('material')
    
    def perform_create(self, serializer):
        """Set submitted_by to current user"""
        serializer.save(submitted_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Admin approves and adds stock"""
        adjustment = self.get_object()
        
        if adjustment.status != 'pending':
            return Response({'error': 'Only pending adjustments can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Update stock using existing service
                ProcurementService.adjust_material_stock(
                    material_id=adjustment.material.id,
                    adjustment_quantity=adjustment.quantity,
                    note=f"Staff request approved: {adjustment.reason}",
                    user=request.user
                )
                
                # Update adjustment status
                adjustment.status = 'approved'
                adjustment.reviewed_by = request.user
                adjustment.reviewed_at = timezone.now()
                adjustment.save()
                
                return Response({
                    'message': f'Added {adjustment.quantity} {adjustment.material.unit} of {adjustment.material.name} to stock',
                    'adjustment': PendingStockAdjustmentSerializer(adjustment).data
                })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Admin rejects the adjustment"""
        adjustment = self.get_object()
        
        if adjustment.status != 'pending':
            return Response({'error': 'Only pending adjustments can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response({'error': 'rejection_reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        adjustment.status = 'rejected'
        adjustment.reviewed_by = request.user
        adjustment.reviewed_at = timezone.now()
        adjustment.rejection_reason = rejection_reason
        adjustment.save()
        
        return Response({
            'message': 'Adjustment request rejected',
            'adjustment': PendingStockAdjustmentSerializer(adjustment).data
        })


class MaterialUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing material usage records"""
    serializer_class = MaterialUsageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter material usage based on query parameters"""
        queryset = MaterialUsage.objects.select_related('material', 'taken_by').all()
        
        # Filter by material
        material_id = self.request.query_params.get('material_id')
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        
        # Filter by user (taken_by)
        taken_by = self.request.query_params.get('taken_by')
        if taken_by:
            queryset = queryset.filter(taken_by_id=taken_by)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(taken_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(taken_at__date__lte=end_date)
        
        return queryset.order_by('-taken_at')
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def record_usage(self, request):
        """Record material usage (when employee picks materials)"""
        material_id = request.data.get('material_id')
        quantity_taken = request.data.get('quantity_taken')
        note = request.data.get('note', '')
        
        if not material_id or not quantity_taken:
            return Response(
                {'error': 'material_id and quantity_taken are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity_taken = int(quantity_taken)
            result = ProcurementService.record_material_usage(
                material_id=material_id,
                quantity_taken=quantity_taken,
                taken_by=request.user,
                note=note
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to record material usage: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProcurementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing procurements"""
    queryset = Procurement.objects.all()
    serializer_class = ProcurementSerializer
    permission_classes = [IsProcurementManager]
    
    def get_queryset(self):
        """Filter procurements based on query parameters"""
        queryset = Procurement.objects.select_related('material', 'created_by')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Supplier filter removed (no longer tracked in model)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(order_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(order_date__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set the created_by field"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        """Mark procurement as delivered and update stock"""
        procurement = self.get_object()
        
        if procurement.status != 'pending':
            return Response(
                {'error': 'Procurement is not in pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProcurementDeliverySerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = ProcurementService.mark_procurement_delivered(
                    procurement_id=procurement.id,
                    delivery_date=serializer.validated_data.get('delivery_date'),
                    user=request.user
                )
                return Response(result, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing job material usage"""
    queryset = JobMaterial.objects.all()
    serializer_class = JobMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter job materials"""
        queryset = JobMaterial.objects.select_related('job', 'material', 'created_by')
        
        # Filter by job
        job_id = self.request.query_params.get('job')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        
        # Filter by material
        material_id = self.request.query_params.get('material')
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        
        return queryset.order_by('-created_at')


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock movement audit logs"""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination to return all records
    
    def get_queryset(self):
        """Filter stock movements"""
        queryset = StockMovement.objects.select_related('material')
        
        # Filter by search term (material name)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(material__name__icontains=search)
        
        # Filter by material
        material_id = self.request.query_params.get('material')
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        
        # Filter by movement type
        movement_type = self.request.query_params.get('movement_type')
        if movement_type:
            # Map frontend types to backend types
            if movement_type == 'in':
                queryset = queryset.filter(movement_type='inflow')
            elif movement_type == 'out':
                queryset = queryset.filter(movement_type='outflow')
            else:
                queryset = queryset.filter(movement_type=movement_type)
        
        # Filter by reference type
        reference_type = self.request.query_params.get('reference_type')
        if reference_type:
            queryset = queryset.filter(reference_type=reference_type)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.order_by('-created_at')


class CustomerContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customer contacts (marketing database).
    Customers are automatically added when works are created.
    Accessible to admin and staff users.
    """
    queryset = CustomerContact.objects.all()
    serializer_class = CustomerContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(phone__icontains=search) |
                Q(notes__icontains=search)
            )
        
        # Filter by marketing eligibility
        can_receive_marketing = self.request.query_params.get('can_receive_marketing')
        if can_receive_marketing == 'true':
            queryset = queryset.filter(opted_out=False)
        elif can_receive_marketing == 'false':
            queryset = queryset.filter(opted_out=True)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(last_work_date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(last_work_date__lte=date_to)
        
        # Filter by minimum works
        min_works = self.request.query_params.get('min_works')
        if min_works:
            queryset = queryset.filter(total_works__gte=int(min_works))
        
        return queryset.order_by('-last_work_date')
    
    @action(detail=False, methods=['get'])
    def marketing_list(self, request):
        """Get list of customers who can receive marketing messages"""
        contacts = self.get_queryset().filter(opted_out=False)
        serializer = self.get_serializer(contacts, many=True)
        return Response({
            'count': contacts.count(),
            'contacts': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def opt_out(self, request, pk=None):
        """Mark a customer as opted out of marketing messages"""
        contact = self.get_object()
        contact.opted_out = True
        contact.save()
        return Response({'status': 'Customer opted out of marketing messages'})
    
    @action(detail=True, methods=['post'])
    def opt_in(self, request, pk=None):
        """Mark a customer as opted in to marketing messages"""
        contact = self.get_object()
        contact.opted_out = False
        contact.save()
        return Response({'status': 'Customer opted in to marketing messages'})
    
    @action(detail=False, methods=['post'])
    def send_bulk_sms(self, request):
        """Send promotional SMS to selected customers"""
        from authentication.sms_backends import send_sms
        
        contact_ids = request.data.get('contact_ids', [])
        message = request.data.get('message', '')
        
        if not contact_ids:
            return Response(
                {'error': 'No contacts selected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message.strip():
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get contacts that can receive marketing
        contacts = CustomerContact.objects.filter(
            id__in=contact_ids, 
            opted_out=False
        )
        
        success_count = 0
        failed_count = 0
        
        for contact in contacts:
            try:
                send_sms(contact.phone, message)
                success_count += 1
            except Exception:
                failed_count += 1
        
        return Response({
            'status': 'Bulk SMS sending completed',
            'success_count': success_count,
            'failed_count': failed_count,
            'total_attempted': contacts.count()
        })


class MarketingMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing marketing message templates.
    Allows creating, editing, and managing promotional message templates.
    Only accessible to admin users.
    """
    queryset = MarketingMessage.objects.all()
    serializer_class = MarketingMessageSerializer
    permission_classes = [permissions.IsAuthenticated, drf_permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by title or message
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(message__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a message template"""
        message = self.get_object()
        message.is_active = not message.is_active
        message.save()
        return Response({
            'status': 'Message template updated',
            'is_active': message.is_active
        })
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Mark template as used (called after sending)"""
        message = self.get_object()
        message.increment_usage()
        return Response({'status': 'Template usage recorded'})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user notifications.
    
    list: Get paginated list of notifications for current user
    retrieve: Get a specific notification
    mark_read: Mark a notification as read
    mark_all_read: Mark all notifications as read
    delete: Delete a notification
    unread_count: Get count of unread notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for current user only"""
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)
        
        # Filter by read status if specified
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Filter by type if specified
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        from .notification_service import mark_notification_read
        
        notification = self.get_object()
        success = mark_notification_read(notification.id, request.user)
        
        if success:
            return Response({
                'status': 'Notification marked as read',
                'id': notification.id
            })
        else:
            return Response(
                {'error': 'Failed to mark notification as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        from .notification_service import mark_all_notifications_read
        
        count = mark_all_notifications_read(request.user)
        return Response({
            'status': 'All notifications marked as read',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})
    
    def destroy(self, request, pk=None):
        """Delete a notification"""
        notification = self.get_object()
        notification.delete()
        return Response(
            {'status': 'Notification deleted'},
            status=status.HTTP_204_NO_CONTENT
        )
