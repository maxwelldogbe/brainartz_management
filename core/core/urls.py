from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    # Use Djoser's JWT endpoints instead of custom ones to avoid conflicts
    path('auth/', include('djoser.urls.jwt')),
    path('auth/', include('djoser.urls')),
    path('api/authentication/', include('authentication.urls')),
    path('api/services/', include('services.urls')),
]

# Serve media and static files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Use Django's built-in static file serving for admin and other app static files
    urlpatterns += staticfiles_urlpatterns()
