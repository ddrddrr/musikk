from musikk.settings.base import *

CELERY_TASK_ALWAYS_EAGER = True

INSTALLED_APPS = [*INSTALLED_APPS, "django_extensions"]

CSRF_TRUSTED_ORIGINS = [
    f"http://localhost:{config('VITE_PORT', default='5175')}",
    f"http://127.0.0.1:{config('VITE_PORT', default='5175')}",
]
