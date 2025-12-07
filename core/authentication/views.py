# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import *
from .serializers import *
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from .sms_backends import send_sms
from rest_framework import generics
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

class ManualEmployeeCreateView(generics.CreateAPIView):
    """Create employee account manually when SMS invitation fails"""
    serializer_class = ManualEmployeeCreateSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Get the generated password
        password = getattr(user, '_generated_password', 'N/A')
        
        # Prepare login information
        login_info = {
            'username': user.username,
            'email': user.email,
            'password': password,
            'phone': user.profile.phone if hasattr(user, 'profile') else 'N/A',
            'full_name': user.get_full_name()
        }
        
        # Try to send login info via SMS
        send_sms_success = False
        if hasattr(user, 'profile') and user.profile.phone:
            sms_message = (
                f"Welcome to the team, {user.get_full_name()}!\n\n"
                f"Your account has been created:\n"
                f"Username: {user.username}\n"
                f"Email: {user.email}\n"
                f"Password: {password}\n\n"
                f"Please log in and change your password.\n"
                f"Welcome aboard!"
            )
            
            try:
                send_sms_success = send_sms(user.profile.phone, sms_message)
            except Exception as e:
                logger.warning(f"Failed to send login info SMS to {user.profile.phone}: {e}")
        
        response_data = {
            'message': 'Employee account created successfully',
            'employee': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name(),
                'phone': user.profile.phone if hasattr(user, 'profile') else None,
                'is_worker': user.is_worker
            },
            'login_credentials': {
                'username': user.username,
                'password': password,
                'email': user.email
            },
            'sms_sent': send_sms_success,
            'instructions': 'Share the login credentials with the employee securely. They should change the password on first login.'
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class ResendLoginCredentialsView(generics.GenericAPIView):
    """Resend login credentials to an existing employee"""
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate new password if requested
        reset_password = request.data.get('reset_password', False)
        new_password = None
        
        if reset_password:
            from django.utils.crypto import get_random_string
            new_password = get_random_string(12)
            user.set_password(new_password)
            user.save()
            logger.info(f"Password reset for user {user.username} by admin {request.user.username}")
        
        # Get phone number from profile
        phone = None
        if hasattr(user, 'profile') and user.profile.phone:
            phone = user.profile.phone
        
        # Prepare message
        if new_password:
            message = (
                f"Hi {user.get_full_name() or user.username}!\n\n"
                f"Your password has been reset:\n"
                f"Username: {user.username}\n"
                f"Email: {user.email}\n"
                f"New Password: {new_password}\n\n"
                f"Please log in and change your password.\n"
            )
        else:
            message = (
                f"Hi {user.get_full_name() or user.username}!\n\n"
                f"Your login details:\n"
                f"Username: {user.username}\n"
                f"Email: {user.email}\n\n"
                f"Contact admin if you need password reset.\n"
            )
        
        # Try to send SMS if phone is available
        sms_success = False
        if phone:
            try:
                sms_success = send_sms(phone, message)
                if sms_success:
                    logger.info(f"Credentials sent via SMS to {phone}")
                else:
                    logger.warning(f"SMS sending failed for {phone}")
            except Exception as e:
                logger.error(f"Failed to send credentials SMS to {phone}: {e}")
        
        # Prepare response data
        response_data = {
            'message': 'Credentials processed successfully',
            'employee': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name() or user.username,
                'phone': phone or 'N/A'
            },
            'sms_sent': sms_success
        }
        
        # Include credentials in response for manual sharing if SMS fails or no phone
        if new_password:
            response_data['login_credentials'] = {
                'username': user.username,
                'email': user.email,
                'password': new_password
            }
            response_data['message'] = 'Password reset successfully' + (' and sent via SMS' if sms_success else ' - Share credentials manually')
        else:
            if not sms_success and not phone:
                response_data['login_credentials'] = {
                    'username': user.username,
                    'email': user.email
                }
            response_data['message'] = 'Credentials sent successfully' if sms_success else 'SMS not available - Share credentials manually'
        
        return Response(response_data, status=status.HTTP_200_OK)


class GenerateInviteTokenView(generics.CreateAPIView):
    serializer_class = InvitationTokenSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = serializer.save()

        token = invite.token
        # Generate frontend registration URL instead of API endpoint
        # This allows users to access the React registration page directly
        base_url = request.build_absolute_uri('/').rstrip('/')
        invite_link = f"{base_url}/portal/register/{token}"

        # Since phone is now required, always send SMS invitation
        sms_text = (
            f"You're invited to join our team! Use this link to create your account: {invite_link}\n"
            f"Your invitation code: {invite.token}\n"
            f"This invitation expires on {invite.expires_at.strftime('%Y-%m-%d at %H:%M')}.\n"
            f"Welcome aboard!"
        )
        
        sms_success = send_sms(invite.phone, sms_text)
        
        response_data = {
            "message": "Employee invitation sent successfully" if sms_success else "Invitation created but SMS failed",
            "invite_link": invite_link,
            "expires_at": invite.expires_at,
            "phone": invite.phone,
            "sms_sent": sms_success
        }
        
        # Include email in response if provided
        if invite.email:
            response_data["email"] = invite.email
            
        # Add fallback suggestion if SMS failed
        if not sms_success:
            response_data["fallback_suggestion"] = "Consider using the manual account creation endpoint: POST /auth/create-employee/"

        return Response(response_data, status=status.HTTP_201_CREATED)


class RegisterFromInviteView(generics.CreateAPIView):
    serializer_class = CustomUserCreateSerializer

    def post(self, request, token):
        try:
            invite = InvitationToken.objects.get(token=token)
        except InvitationToken.DoesNotExist:
            return Response({"error": "Invalid invitation token"}, status=400)

        if invite.is_expired() or invite.used:
            return Response({"error": "Invitation token has expired or already been used"}, status=400)

        # Since phone is now required for all invitations, we always have a phone number
        payload = request.data.copy()
        
        # Handle email: if invite has email, use it; if user provides email, use that; 
        # otherwise generate placeholder since email is required by User model
        if invite.email:
            payload['email'] = invite.email
        elif not payload.get('email'):
            # Generate a unique placeholder email using phone and token
            safe_phone = invite.phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            placeholder = f"emp-{safe_phone}-{str(invite.token)[:8]}@company.local"
            payload['email'] = placeholder

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        
        # Create user with proper email and mark as worker (employee)
        user = serializer.save(
            email=payload.get('email'), 
            is_worker=True
        )

        # Save phone number to user's profile (phone is guaranteed to exist since it's required)
        try:
            if hasattr(user, 'profile'):
                user.profile.phone = invite.phone
                user.profile.save()
        except Exception as e:
            # Profile creation might fail, but it's not critical for registration
            logger.warning(f"Failed to save phone to profile: {e}")

        # Mark invitation token as used
        invite.used = True
        invite.save()

        # Generate JWT tokens for immediate login
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Employee account created successfully! Welcome to the team.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_worker": user.is_worker,
                "phone": invite.phone
            }
        }, status=status.HTTP_201_CREATED)



class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the logged-in user's profile."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        # profile should exist due to signal
        # Some existing users may lack a Profile (migration or pre-signal users).
        # Ensure one exists on-demand to avoid 500 errors.
        profile = getattr(self.request.user, 'profile', None)
        if profile is None:
            profile = Profile.objects.create(user=self.request.user)
        return profile
    
    def get_serializer_context(self):
        """Add request to serializer context for URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PasswordChangeView(generics.GenericAPIView):
    """Allow authenticated users to change their password"""
    serializer_class = PasswordChangeSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info(f"Password changed successfully for user {request.user.username}")
        
        return Response({
            'message': 'Password changed successfully',
            'detail': 'You can now login with your new password'
        }, status=status.HTTP_200_OK)