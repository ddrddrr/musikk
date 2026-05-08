from rest_framework.authentication import (
    SessionAuthentication as DRFSessionAuthentication,
)


class SessionAuthentication(DRFSessionAuthentication):
    """Make DRF return 401, not 403, for anonymous requests

    DRF falls back to 403 when auth class doesn't return a WWW-Authenticate header,
    any non-empty string changes it to 401
    """

    def authenticate_header(self, request):
        return "Session"
