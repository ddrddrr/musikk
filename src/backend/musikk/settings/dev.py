from src.backend.musikk.settings.base import *


INSTALLED_APPS += ("debug_toolbar",)
MIDDLEWARE += [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]
