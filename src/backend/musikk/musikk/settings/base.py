"""
For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
import sys
from pathlib import Path

from corsheaders.defaults import default_headers
from decouple import AutoConfig, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # musikk dir(under backend/)
ROOT_DIR = BASE_DIR.parent.parent.parent  # root dir(where /src lives)

config = AutoConfig(search_path=ROOT_DIR)

DJANGO_BASE_URL = config("DJANGO_BASE_URL", default="http://localhost:8000")

SECRET_KEY = config("SECRET_KEY", default="<SECRET_KEY>")

DEBUG = config("DEBUG", default=True, cast=bool)

### Security
# Set without scheme, it is validated against HTTP Host header
ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv()
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = (
    *default_headers,
    "Bearer",
    "Last-Event-ID",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
)

### Application definition
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
    "django.contrib.sites",
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
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "dj_rest_auth",
    "dj_rest_auth.registration",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
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


REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "password")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6375")
REDIS_DB = os.getenv("REDIS_DB", "1")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}",
    }
}

### REST
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        # TODO: probably remove in prod
        "rest_framework.renderers.BrowsableAPIRenderer",
        "django_eventstream.renderers.SSEEventRenderer",
    ],
}

### AUTH
# Used by dj-rest-auth
SITE_ID = 1

# TODO: switch to redis only when configured for persistence
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_CACHE_ALIAS = "default"

REST_AUTH = {"TOKEN_MODEL": None}
REST_AUTH_REGISTER_SERIALIZERS = {
    "REGISTER_SERIALIZER": "users.api.v1.serializers.BaseRegisterSerializer",
}

# `allauth` settings
# new_user
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_LOGIN_METHODS = ["email"]

ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_EMAIL_VERIFICATION_BY_CODE_ENABLED = True
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 1  # days
ACCOUNT_EMAIL_NOTIFICATIONS = True
ACCOUNT_CHANGE_EMAIL = True
ACCOUNT_MAX_EMAIL_ADDRESSES = 2

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

### EVENTSTREAM
EVENTSTREAM_STORAGE_CLASS = "django_eventstream.storage.DjangoModelStorage"

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": config("SQL_ENGINE", default="django.db.backends.postgresql"),
        "USER": config("POSTGRES_USER", default="user"),
        "PASSWORD": config("POSTGRES_PASSWORD", default="password"),
        "NAME": config("POSTGRES_DB", default="db"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default="5435"),
    },
}


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = config("STATIC_URL", default="static/")
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.BaseUser"

### MEDIA
MEDIA_ROOT = config("MEDIA_ROOT", default=os.path.join(ROOT_DIR, "media"))
# Relative to MEDIA_ROOT
AUDIO_CONTENT_PATH = config("AUDIO_CONTENT_PATH", default="audio")
MEDIA_URL = config("MEDIA_URL", default="media/")

### LOGS

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "[{levelname}] {asctime} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "standard",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

### MISC
MAX_PATH_LENGTH = os.pathconf("/", "PC_PATH_MAX")

### Celery
# See detailed info about options here https://gist.github.com/fjsj/da41321ac96cf28a96235cb20e7236f6

CELERY_TASK_ALWAYS_EAGER = config("CELERY_TASK_ALWAYS_EAGER", cast=bool, default=True)
CELERY_BROKER_URL = config(
    "CELERY_BROKER_URL", default="amqp://user:password@localhost:5672//"
)
CELERY_BROKER_TRANSPORT_OPTIONS = {"confirm_publish": True, "confirm_timeout": 5.0}
# CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="")
CELERY_TASK_ACKS_LATE = config("CELERY_TASK_ACKS_LATE", cast=bool, default=True)
CELERY_TASK_ACKS_ON_FAILURE_OR_TIMEOUT = config(
    "CELERY_TASK_ACKS_ON_FAILURE_OR_TIMEOUT", cast=bool, default=True
)
CELERY_TASK_REJECT_ON_WORKER_LOST = config(
    "CELERY_TASK_REJECT_ON_WORKER_LOST", cast=bool, default=False
)
CELERY_WORKER_PREFETCH_MULTIPLIER = config(
    "CELERY_WORKER_PREFETCH_MULTIPLIER", cast=int, default=1
)
CELERY_WORKER_CONCURRENCY = config(
    "CELERY_WORKER_CONCURRENCY", cast=lambda v: int(v) if v else None, default=None
)
CELERY_WORKER_MAX_TASKS_PER_CHILD = config(
    "CELERY_WORKER_MAX_TASKS_PER_CHILD", cast=int, default=1000
)
