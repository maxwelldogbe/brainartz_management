from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    # Use Djoser's JWT endpoints instead of custom ones to avoid conflicts
    path('auth/', include('djoser.urls.jwt')),
    path('auth/', include('djoser.urls')),
    path('api/authentication/', include('authentication.urls')),
    path('api/services/', include('services.urls')),
]

# Serve media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve Vite assets directly at /assets/ path (bypassing /static/)
assets_dir = os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist', 'assets')
if os.path.exists(assets_dir):
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', 
                lambda request, path: serve(request, path, document_root=assets_dir),
                name='vite-assets'),
    ]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()

# Serve React's index.html for all non-API routes (catch-all for React Router)
# This must be last to avoid catching API/auth/admin/media/static/assets routes
react_index = os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist', 'index.html')
if os.path.exists(react_index):
    urlpatterns += [
        re_path(r'^(?!api/|auth/|admin/|media/|static/|assets/).*$', 
                lambda request: serve(request, 'index.html', 
                                     document_root=os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist')),
                name='react-app'),
    ]
