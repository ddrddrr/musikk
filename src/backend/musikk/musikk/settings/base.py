"""
For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
from pathlib import Path

from corsheaders.defaults import default_headers
from decouple import config, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DJANGO_BASE_URL = config("DJANGO_BASE_URL", default="http://localhost:8000")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY", default="musikk-secret-key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv()
)
# TODO: change to dev/prod variants
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8000",
]
# CORS_URLS_REGEX = r"^*media*$"

CORS_ALLOW_HEADERS = (
    *default_headers,
    "Bearer",
    "Last-Event-ID",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
)
# Application definition
INSTALLED_APPS = [
    "corsheaders",
    "jazzmin",
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    ##
    "users.apps.UsersConfig",
    "streaming.apps.StreamingConfig",
    "recommendations.apps.RecommendationsConfig",
    "base.apps.BaseConfig",
    "api.apps.ApiConfig",
    "social.apps.SocialConfig",
    "notifications.apps.NotificationsConfig",
    ##
    "django_eventstream",
    "django_filters",
    "django_extensions",
    "rest_framework",
    "rest_framework_simplejwt",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "musikk.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.media",
            ],
        },
    },
]

WSGI_APPLICATION = "musikk.wsgi.application"
ASGI_APPLICATION = "musikk.asgi.application"
# REST
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.tokens.UUIDJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
        "django_eventstream.renderers.SSEEventRenderer",
    ],
}
SIMPLE_JWT = {
    "USER_ID_FIELD": "uuid",
    "USER_ID_CLAIM": "uuid",
    "TOKEN_OBTAIN_SERIALIZER": "users.api.v1.serializers.TokenPairSerializer",
}
EVENTSTREAM_STORAGE_CLASS = "django_eventstream.storage.DjangoModelStorage"
# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": config("SQL_ENGINE", default="django.db.backends.postgresql"),
        "USER": config("POSTGRES_USER", default="musikk_user"),
        "PASSWORD": config("POSTGRES_PASSWORD", default="musikk_password"),
        "NAME": config("POSTGRES_DB", default="postgres_db"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default="5432"),
    },
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

INTERNAL_IPS = [
    config("DJANGO_BASE_URL", default="127.0.0.1"),
]

AUTH_USER_MODEL = "users.BaseUser"

# MEDIA CONTENT
MEDIA_ROOT = config("MEDIA_ROOT", default="/tmp/media/musikk_media")
MEDIA_URL = "media/"
AUDIO_CONTENT_PATH = config("AUDIO_CONTENT_PATH", default="/tmp/media/musikk_audio")

# LOGS
# settings.py

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django_eventstream": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
    },
}

# MISC
MAX_PATH_LENGTH = os.pathconf("/", "PC_PATH_MAX")
