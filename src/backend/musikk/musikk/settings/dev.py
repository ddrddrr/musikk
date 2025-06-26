from musikk.settings.base import *

# set FQDN
CORS_ALLOWED_ORIGINS = [
    config("SERVICE_URL", default="https://musikk.stream"),
]

REST_FRAMEWORK = REST_FRAMEWORK | {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/m", "user": "500/m"},
}

# Can be used with HTTPs only
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

EMAIL_HOST = config("EMAIL_HOST")
EMAIL_PORT = config("EMAIL_PORT", cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = True
