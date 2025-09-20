from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from datetime import timedelta
from django.utils import timezone
from .models import *


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone', 'bio', 'avatar']

class CustomUserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'is_worker')

class UserSerializer(BaseUserSerializer):
    is_admin = serializers.BooleanField(read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'is_worker', 'is_admin')


class InvitationTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvitationToken
        fields = ['email', 'phone']

    def validate(self, attrs):
        email = attrs.get('email')
        phone = attrs.get('phone')
        if not email and not phone:
            raise serializers.ValidationError('Provide either email or phone to invite')
        return attrs

    def create(self, validated_data):
        # one-day expiry
        expires_at = timezone.now() + timedelta(hours=24)
        return InvitationToken.objects.create(expires_at=expires_at, **validated_data)