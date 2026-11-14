"""
drf-spectacular extensions for the third-party auth classes that the users app
uses. `UsersConfig.ready` imports this module, which registers them.
"""

from drf_spectacular.authentication import SessionScheme
from drf_spectacular.contrib.rest_auth import RestAuthDetailSerializer
from drf_spectacular.extensions import OpenApiViewExtension
from drf_spectacular.utils import extend_schema


class MusikkSessionScheme(SessionScheme):
    """
    The built-in session scheme matches only DRF's own class, not its
    subclasses, so the project's subclass needs its own entry.
    """

    target_class = "users.authentication.SessionAuthentication"


class SessionLoginViewExtension(OpenApiViewExtension):
    """
    The built-in dj-rest-auth extension expects a token in the login response.
    This project has no token model and logs in through the session, so login
    answers with 204 and no body.
    """

    target_class = "dj_rest_auth.views.LoginView"
    priority = 1

    def view_replacement(self):
        class Fixed(self.target_class):
            @extend_schema(responses={204: None})
            def post(self, request, *args, **kwargs):
                pass

        return Fixed


class RegisterViewExtension(OpenApiViewExtension):
    """
    The built-in dj-rest-auth extension picks the response from the email
    verification setting, and expects a token when verification is off. That
    setting comes from the environment, so the schema would change between
    machines. Registration answers with a `detail` message when verification
    is on, and with no body when it is off.
    """

    target_class = "dj_rest_auth.registration.views.RegisterView"
    priority = 1

    def view_replacement(self):
        class Fixed(self.target_class):
            @extend_schema(responses={201: RestAuthDetailSerializer, 204: None})
            def post(self, request, *args, **kwargs):
                pass

        return Fixed
