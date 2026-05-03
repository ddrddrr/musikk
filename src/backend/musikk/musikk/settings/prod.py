from musikk.settings.base import *

DEBUG = False
CELERY_TASK_ALWAYS_EAGER = False

CORS_ALLOWED_ORIGINS = [
    config("SERVICE_URL", default="https://musikk.stream"),
]
CSRF_TRUSTED_ORIGINS = [
    config("SERVICE_URL", default="https://musikk.stream"),
]

REST_FRAMEWORK = REST_FRAMEWORK | {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "10/m", "user": "500/m"},
}

DATABASES["default"]["CONN_MAX_AGE"] = config("DB_CONN_MAX_AGE", default=60, cast=int)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_REFERRER_POLICY = "same-origin"

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

LOGGING["root"]["level"] = "INFO"

EMAIL_HOST = config("EMAIL_HOST")
EMAIL_PORT = config("EMAIL_PORT", cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = True
