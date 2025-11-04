from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        if not extra_fields.get('is_admin'):
            raise ValueError('Superuser must have is_admin=True')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_worker = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)  # Explicit admin privilege

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @property
    def is_staff(self):
        # Use is_admin to enforce admin privileges
        return self.is_admin

    @is_staff.setter
    def is_staff(self, value):
        # allow Django or external code to set is_staff by mapping to is_admin
        self.is_admin = bool(value)

    def __str__(self):
        return self.email


class InvitationToken(models.Model):
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=False, null=False, help_text="Phone number is required for SMS invitations")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_expired(self):
        return self.used or timezone.now() > self.expires_at

    def __str__(self):
        target = self.email or self.phone or str(self.token)
        return f"Invited for {target}"


# Profile for all users (created automatically)
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=30, blank=True, default='', help_text="Phone number for contact and SMS notifications")
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # avoid calling get_full_name on Anonymous
        try:
            return self.user.get_full_name() or str(self.user)
        except Exception:
            return str(self.user)


# Create profile automatically when a User is created
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_profile(sender, instance, created, **kwargs):
    if created:
        # create Profile for every user
        Profile.objects.create(user=instance)