
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Use Djoser's JWT endpoints instead of custom ones to avoid conflicts
    path('auth/', include('djoser.urls.jwt')),
    path('auth/', include('djoser.urls')),
    path('api/authentication/', include('authentication.urls')),
    path('api/services/', include('services.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
