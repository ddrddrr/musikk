from musikk.settings.base import *

CORS_ALLOWED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5173')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5173')}",
]
CSRF_TRUSTED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5173')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5173')}",
]
