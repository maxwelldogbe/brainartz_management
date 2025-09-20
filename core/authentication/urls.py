from django.urls import path
from .views import GenerateInviteTokenView, RegisterFromInviteView
from .views import ProfileView

app_name = 'accounts'

urlpatterns = [
    path('invite/', GenerateInviteTokenView.as_view(), name='generate-invite'),
    path('register/<uuid:token>/', RegisterFromInviteView.as_view(), name='register-from-invite'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
