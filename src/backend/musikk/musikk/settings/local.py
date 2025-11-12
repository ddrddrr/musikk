from musikk.settings.base import *

INTERNAL_IPS = ["localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5173')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5173')}",
]
CSRF_TRUSTED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5173')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5173')}",
]

INSTALLED_APPS += ("debug_toolbar",)
MIDDLEWARE += [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]
