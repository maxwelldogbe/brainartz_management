# Create your views here.
from rest_framework import generics, permissions, status
from .models import *
from .serializers import *
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from .sms_backends import send_sms
from rest_framework import generics
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated

class GenerateInviteTokenView(generics.CreateAPIView):
    serializer_class = InvitationTokenSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = serializer.save()

        token = invite.token
        invite_link = request.build_absolute_uri(
            reverse('accounts:register-from-invite', args=[token])
        )

        # If phone provided, try sending SMS. Include token and link for convenience.
        if invite.phone:
            sms_text = (
                f"You're invited to join. Use this link to register: {invite_link}"
                f"\nOr use this code: {invite.token}\nThis link expires on {invite.expires_at}."
            )
            send_sms(invite.phone, sms_text)

        return Response({
            "invite_link": invite_link,
            "expires_at": invite.expires_at,
            "phone": invite.phone,
            "email": invite.email,
        })


class RegisterFromInviteView(generics.CreateAPIView):
    serializer_class = CustomUserCreateSerializer

    def post(self, request, token):
        try:
            invite = InvitationToken.objects.get(token=token)
        except InvitationToken.DoesNotExist:
            return Response({"error": "Invalid token"}, status=400)

        if invite.is_expired() or invite.used:
            return Response({"error": "Token expired or already used"}, status=400)

        # Allow phone-only invites to register without an email by generating
        # a placeholder email. This keeps AUTH_USER_MODEL constraints intact
        # while allowing signup via SMS. If the invite includes an email, we
        # prefer that.
        payload = request.data.copy()
        if invite.phone and not invite.email:
            # if caller supplied an email use it; otherwise generate a unique placeholder
            supplied_email = payload.get('email')
            if not supplied_email:
                # create a deterministic placeholder using phone and token so it's unique
                safe_phone = invite.phone.replace('+', '').replace(' ', '').replace('/', '')
                placeholder = f"{safe_phone}-{invite.token}@noemail.local"
                payload['email'] = placeholder
            else:
                payload['email'] = supplied_email

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        # ensure created user email matches invitation (email or generated placeholder)
        user = serializer.save(email=invite.email or payload.get('email'), is_worker=True)

        # Save phone on the user's profile if invite was sent to a phone
        try:
            if invite.phone:
                # profile should be auto-created by the post_save signal on User
                if hasattr(user, 'profile'):
                    user.profile.phone = invite.phone
                    user.profile.save()
        except Exception:
            # if profile wasn't created for any reason, ignore silently — it's non-fatal
            pass

        # Mark token as used
        invite.used = True
        invite.save()

        # 🔐 Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "User created successfully",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)



class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the logged-in user's profile."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # profile should exist due to signal
        # Some existing users may lack a Profile (migration or pre-signal users).
        # Ensure one exists on-demand to avoid 500 errors.
        profile = getattr(self.request.user, 'profile', None)
        if profile is None:
            profile = Profile.objects.create(user=self.request.user)
        return profile