"""
For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
from pathlib import Path
from typing import Literal

from corsheaders.defaults import default_headers
from decouple import AutoConfig, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # musikk dir(under backend/)
ROOT_DIR = BASE_DIR.parent.parent.parent  # root dir(where /src lives)

config = AutoConfig(search_path=ROOT_DIR)

SECRET_KEY = config("SECRET_KEY")

DEBUG = config("DEBUG", default=True, cast=bool)

### Security
ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv()
)
# TODO: remove, we dont need cross-origin requests
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = (
    *default_headers,
    "Bearer",
    "Last-Event-ID",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
)

### Core
INSTALLED_APPS = [
    "daphne",
    "channels",
    "corsheaders",
    "jazzmin",
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
    "anymail",
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


REDIS_PASSWORD = config("REDIS_PASSWORD")
REDIS_HOST = config("REDIS_HOST", default="localhost")
REDIS_PORT = config("REDIS_PORT", default="6375")
REDIS_DB = config("REDIS_DB", default="1")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}",
    }
}

# TODO: make in-mem for local?
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0"],
        },
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
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    # "DEFAULT_PAGINATION_CLASS": "musikk.pagination.BaseLimitOffsetPagination",
    "PAGE_SIZE": 10,
    "EXCEPTION_HANDLER": "base.exception_handler.musikk_exception_handler",
}

### AUTH
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

# Used by dj-rest-auth
SITE_ID = 1

# TODO: switch to redis only when configured for persistence
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_CACHE_ALIAS = "default"

REST_AUTH = {
    "TOKEN_MODEL": None,
    "REGISTER_SERIALIZER": "users.api.v1.serializers.BaseRegisterSerializer",
}
# `allauth` settings
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_LOGIN_METHODS = ["email"]

# Deprecated, but required in dj-rest-auth
# see https://github.com/iMerica/dj-rest-auth/issues/685
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_USERNAME_REQUIRED = False

ACCOUNT_EMAIL_VERIFICATION: Literal["mandatory", "none", "optional"] = config(
    "ACCOUNT_EMAIL_VERIFICATION", default="mandatory"
)
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 1  # days
ACCOUNT_EMAIL_NOTIFICATIONS = True
ACCOUNT_CHANGE_EMAIL = True
ACCOUNT_MAX_EMAIL_ADDRESSES = 2

ACCOUNT_ADAPTER = "users.adapters.BaseAccountAdapter"
ACCOUNT_RATE_LIMITS = config("ACCOUNT_RATE_LIMITS", default=True, cast=bool)
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


### Frontend
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5175")

### MAIL
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="no-reply@mail.musikk.stream")
SERVER_EMAIL = config("SERVER_EMAIL", default="server@mail.musikk.stream")
ANYMAIL = {
    "MAILGUN_API_KEY": config("MAILGUN_API_KEY", ""),
    "MAILGUN_SENDER_DOMAIN": config("MAILGUN_SENDER_DOMAIN", ""),
    "MAILGUN_API_URL": config("MAILGUN_API_URL", ""),
}


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": config("SQL_ENGINE", default="django.db.backends.postgresql"),
        "USER": config("POSTGRES_USER", default="user"),
        "PASSWORD": config("POSTGRES_PASSWORD"),
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

### FFMPEG, Shaka-packager
FFMPEG_BIN = config("FFMPEG_BIN", default="/usr/bin/ffmpeg")
FFPROBE_BIN = config("FFPROBE_BIN", default="/usr/bin/ffprobe")
SHAKA_PACKAGER_BIN = config("SHAKA_PACKAGER_BIN", default="/usr/bin/packager")

### LOGS
# TODO: improve
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG" if DEBUG else "INFO",
    },
    "loggers": {
        # suppress websocket packet/frame debug spam
        "daphne.ws_protocol": {
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
    "CELERY_BROKER_URL",
    default=f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/2",
)
CELERY_BROKER_TRANSPORT_OPTIONS = {"visibility_timeout": 700}
# CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="")
# this is setup, so the task is always finished (even if fails)
CELERY_TASK_ACKS_LATE = config("CELERY_TASK_ACKS_LATE", cast=bool, default=True)
CELERY_TASK_ACKS_ON_FAILURE_OR_TIMEOUT = config(
    "CELERY_TASK_ACKS_ON_FAILURE_OR_TIMEOUT", cast=bool, default=False
)
CELERY_TASK_REJECT_ON_WORKER_LOST = config(
    "CELERY_TASK_REJECT_ON_WORKER_LOST", cast=bool, default=True
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
CELERY_TASK_SOFT_TIME_LIMIT = config(
    "CELERY_TASK_SOFT_TIME_LIMIT", cast=int, default=540
)
CELERY_TASK_TIME_LIMIT = config("CELERY_TASK_TIME_LIMIT", cast=int, default=600)
