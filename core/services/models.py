from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Customer(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    # track which employee created the customer record
    creator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Work(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='works')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    worker = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='works_done'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    note = models.TextField(blank=True, null=True)  # Memo field for workers

    def __str__(self):
        return f"{self.description} for {self.customer.name}"


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
