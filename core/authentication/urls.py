from django.urls import path
from .views import GenerateInviteTokenView, RegisterFromInviteView
from .views import ProfileView, ManualEmployeeCreateView, ResendLoginCredentialsView

app_name = 'accounts'

urlpatterns = [
    path('invite/', GenerateInviteTokenView.as_view(), name='generate-invite'),
    path('register/<uuid:token>/', RegisterFromInviteView.as_view(), name='register-from-invite'),
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Manual employee account management
    path('create-employee/', ManualEmployeeCreateView.as_view(), name='create-employee'),
    path('resend-credentials/<int:user_id>/', ResendLoginCredentialsView.as_view(), name='resend-credentials'),
]
