from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Customer, Work, Payment, EmployeeProfile

User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Customer
        fields = "__all__"


class WorkSerializer(serializers.ModelSerializer):
    # allow writing customer by id, but expose a convenient customer_name for reads
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    customer_name = serializers.SerializerMethodField(read_only=True)
    worker = serializers.StringRelatedField()

    class Meta:
        model = Work
        fields = [
            'id', 'customer', 'customer_name', 'description', 'price', 'worker',
            'created_at', 'completed', 'note'
        ]

    def get_customer_name(self, obj):
        try:
            return obj.customer.name
        except Exception:
            return None


class PaymentSerializer(serializers.ModelSerializer):
    # allow write via work id, but provide work details for read
    work = serializers.PrimaryKeyRelatedField(queryset=Work.objects.all())
    work_description = serializers.SerializerMethodField(read_only=True)
    processed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Payment
        # processed_by will be set from request.user in the view; note is allowed
        fields = [
            'id', 'work', 'work_description', 'amount', 'paid_at', 'method', 'tracking_number',
            'processed_by', 'note'
        ]

    def get_work_description(self, obj):
        try:
            return obj.work.description
        except Exception:
            return None


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
    class Meta:
        model = User
        fields = ["id", "username", "email"]
