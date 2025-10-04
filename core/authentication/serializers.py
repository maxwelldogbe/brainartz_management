from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from datetime import timedelta
from django.utils import timezone
from .models import *


class ProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=30, required=True, help_text="Phone number is required for contact and SMS notifications")
    
    class Meta:
        model = Profile
        fields = ['phone', 'bio', 'avatar']
        
    def validate_phone(self, value):
        """Validate phone number format"""
        if not value or not value.strip():
            raise serializers.ValidationError('Phone number is required')
        
        # Basic phone number validation
        clean_phone = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not any(char.isdigit() for char in clean_phone):
            raise serializers.ValidationError('Please provide a valid phone number')
        
        return value

class CustomUserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'is_worker')


class ManualEmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for manually creating employee accounts by admin"""
    phone = serializers.CharField(max_length=30, required=True, help_text="Employee phone number")
    password = serializers.CharField(write_only=True, required=False, help_text="Optional password (will generate if not provided)")
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'password']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': False},  # Can be generated if not provided
        }
    
    def validate_phone(self, value):
        """Validate phone number format"""
        if not value or not value.strip():
            raise serializers.ValidationError('Phone number is required for employee accounts')
        
        # Basic phone number validation
        clean_phone = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not any(char.isdigit() for char in clean_phone):
            raise serializers.ValidationError('Please provide a valid phone number')
        
        return value
    
    def validate_username(self, value):
        """Ensure username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists')
        return value
    
    def validate_email(self, value):
        """Validate email if provided"""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value
    
    def create(self, validated_data):
        """Create employee account with automatic profile creation"""
        from django.utils.crypto import get_random_string
        from authentication.sms_backends import normalize_phone_number
        
        phone = validated_data.pop('phone')
        password = validated_data.pop('password', None)
        
        # Generate password if not provided
        if not password:
            password = get_random_string(12)  # Generate 12-character password
        
        # Generate email if not provided
        if not validated_data.get('email'):
            safe_phone = normalize_phone_number(phone).replace('+', '').replace(' ', '').replace('-', '')
            username = validated_data['username']
            validated_data['email'] = f"{username}-{safe_phone[:6]}@company.local"
        
        # Create user account
        user = User.objects.create_user(
            password=password,
            is_worker=True,
            **validated_data
        )
        
        # Update or create profile with phone number
        if hasattr(user, 'profile'):
            user.profile.phone = normalize_phone_number(phone)
            user.profile.save()
        else:
            from authentication.models import Profile
            Profile.objects.create(user=user, phone=normalize_phone_number(phone))
        
        # Store password for return (since it might be generated)
        user._generated_password = password
        
        return user

class UserSerializer(BaseUserSerializer):
    is_admin = serializers.BooleanField(read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'is_worker', 'is_admin')


class InvitationTokenSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=30, required=True, help_text="Phone number is required for SMS invitations")
    
    class Meta:
        model = InvitationToken
        fields = ['email', 'phone']

    def validate_phone(self, value):
        """Validate phone number format and ensure it's provided"""
        if not value or not value.strip():
            raise serializers.ValidationError('Phone number is required for employee invitations')
        
        # Basic phone number validation - remove spaces and check if it contains digits
        clean_phone = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not any(char.isdigit() for char in clean_phone):
            raise serializers.ValidationError('Please provide a valid phone number')
        
        return value

    def validate(self, attrs):
        # Phone is now required, so we just ensure it exists
        phone = attrs.get('phone')
        if not phone:
            raise serializers.ValidationError('Phone number is required for employee invitations')
        return attrs

    def create(self, validated_data):
        # one-day expiry
        expires_at = timezone.now() + timedelta(hours=24)
        return InvitationToken.objects.create(expires_at=expires_at, **validated_data)