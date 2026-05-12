from musikk.settings.base import *

DEBUG = False
CELERY_TASK_ALWAYS_EAGER = False

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

DATABASES["default"]["OPTIONS"] = {
    "pool": {
        "min_size": 2,
        "max_size": 10,
        "timeout": 10,
    },
}

CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=True, cast=bool)
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=True, cast=bool)
# this really won't do any redirects even though we terminate https
# in caddy and call be via http
# since this only redirects when request.is_secure() == False
# and the combination of USE_X_FORWARDED_HOST + SECURE_PROXY_SSL_HEADER ensures that this evaluates
# to True if we send the proper forwarded host header from caddy
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_REFERRER_POLICY = "same-origin"

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

LOGGING["root"]["level"] = "INFO"
