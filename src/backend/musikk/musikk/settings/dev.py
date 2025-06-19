from musikk.settings.base import *

# set FQDN
CORS_ALLOWED_ORIGINS = [
    config("SERVICE_URL", default="https://musikk.stream"),
]

CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
