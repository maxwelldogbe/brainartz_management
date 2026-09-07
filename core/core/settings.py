from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from conventional project .env locations.
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv is not None:
    for dotenv_path in (BASE_DIR / '.env', BASE_DIR.parent / '.env'):
        if dotenv_path.exists():
            load_dotenv(dotenv_path)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Read SECRET_KEY from environment (.env)
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError(
        f"DJANGO_SECRET_KEY must be set in environment or .env file "
        f"(checked: {BASE_DIR / '.env'} and {BASE_DIR.parent / '.env'})"
    )

# SECURITY WARNING: don't run with debug turned on in production!
# Allow DEBUG override from environment
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('1', 'false', 'yes')

# Remove duplicate - moved to bottom of file
# ALLOWED_HOSTS = [
#     'localhost',
#     '127.0.0.1',
# ]


# Application definition

INSTALLED_APPS = [
    'daphne',       # Must be first for Channels
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'djoser',
    'authentication',
    'services',
    'rest_framework.authtoken',
    'django.contrib.sites',
    'channels',     # WebSocket support
]
SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise allows the Django app to serve its own static files in
    # simple deployments (and when DEBUG is False). It's installed in
    # requirements.txt; enabling the middleware here makes collectstatic
    # output available at STATIC_URL without a separate web server.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Channels (WebSocket) Configuration
ASGI_APPLICATION = 'core.asgi.application'

# Channel Layer Configuration (Redis for production, in-memory for development)
if DEBUG:
    # Use in-memory channel layer for development
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }
else:
    # Use Redis for production
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [(os.getenv('REDIS_HOST', 'localhost'), int(os.getenv('REDIS_PORT', 6379)))],
                "capacity": 300,
                "expiry": 60,
            },
        },
    }


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Additional directories to collect static files from (for Vite React build)
# Vite builds to frontend/dist with assets in dist/assets/
# We serve the entire dist folder to preserve the /assets/ path structure
STATICFILES_DIRS = []
dist_path = os.path.join(BASE_DIR.parent, 'frontend', 'dist')
if os.path.exists(dist_path):
    STATICFILES_DIRS = [dist_path]

STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# When DEBUG is False and collectstatic has been run, use WhiteNoise's
# compressed manifest storage so the app can serve static files itself.
# This makes static files available at STATIC_URL without an external webserver.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise configuration for Vite SPA
# Serve index.html for non-file paths (SPA routing)
WHITENOISE_ROOT = os.path.join(BASE_DIR.parent, 'frontend', 'dist')
WHITENOISE_INDEX_FILE = True

# Media files (uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

DJOSER = {
    'LOGIN_FIELD': 'email',
    'USER_CREATE_PASSWORD_RETYPE': True,
    'USERNAME_CHANGED_EMAIL_CONFIRMATION': True,
    'PASSWORD_CHANGED_EMAIL_CONFIRMATION': True,
    'SEND_CONFIRMATION_EMAIL': True,
    'SET_USERNAME_RETYPE': True,
    'SET_PASSWORD_RETYPE': True,
    'TOKEN_MODEL' : None,
    'PASSWORD_RESET_CONFIRM_URL': 'password/reset/confirm/{uid}/{token}',
    'USERNAME_RESET_CONFIRM_URL': 'email/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': 'activate/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL': True,
    'SERIALIZERS': {
    'user_create': 'authentication.serializers.CustomUserCreateSerializer',
    'user': 'authentication.serializers.UserSerializer',
    'current_user': 'authentication.serializers.UserSerializer',
    }
}

# JWT Config
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

AUTH_USER_MODEL = 'authentication.User'


# Email settings — allow override from environment
EMAIL_BACKEND = os.getenv('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.getenv('DJANGO_DEFAULT_FROM_EMAIL', 'admin@shopmanager.com')

# SMS Settings - Teleconic API Configuration
TELECONIC_API_KEY = os.getenv('TELECONIC_API_KEY')
TELECONIC_SENDER_ID = os.getenv('TELECONIC_SENDER_ID')
TELECONIC_API_URL = os.getenv('TELECONIC_API_URL')

# Hosts - Allow both localhost and 127.0.0.1 for development and production
ALLOWED_HOSTS = [host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if host.strip()]

# CORS / CSRF origins for local dashboard development.
default_origins = 'http://localhost:3031,http://127.0.0.1:3031,http://localhost:5173,http://127.0.0.1:5173'
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('DJANGO_CORS_ALLOWED_ORIGINS', default_origins).split(',')
    if origin.strip()
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('DJANGO_CSRF_TRUSTED_ORIGINS', default_origins).split(',')
    if origin.strip()
]
