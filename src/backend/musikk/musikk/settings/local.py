from musikk.settings.base import *

CORS_ALLOWED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5173')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5173')}",
]

REST_FRAMEWORK = REST_FRAMEWORK | {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/m", "user": "500/m"},
}

INSTALLED_APPS += ("debug_toolbar",)
MIDDLEWARE += [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]
