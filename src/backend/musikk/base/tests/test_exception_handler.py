from django.test import TestCase
from rest_framework.exceptions import (
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)

from base.exception_handler import musikk_exception_handler


class TestMusikkExceptionHandler(TestCase):
    def _handle(self, exc):
        return musikk_exception_handler(exc, {})

    def test_returns_none_for_unhandled_python_exception(self):
        self.assertIsNone(self._handle(RuntimeError("boom")))

    def test_validation_error_dict_with_field_and_non_field(self):
        exc = ValidationError(
            {
                "email": ["Already taken."],
                "password1": ["Too short.", "Too common."],
                "non_field_errors": ["Passwords do not match."],
            }
        )
        response = self._handle(exc)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Passwords do not match.")
        self.assertEqual(response.data["code"], "invalid")
        self.assertEqual(
            response.data["errors"],
            {
                "email": ["Already taken."],
                "password1": ["Too short.", "Too common."],
                "non_field": ["Passwords do not match."],
            },
        )

    def test_validation_error_dict_field_only_uses_generic_detail(self):
        exc = ValidationError({"email": ["Already taken."]})
        response = self._handle(exc)
        self.assertEqual(response.data["detail"], "Some fields are invalid.")
        self.assertEqual(response.data["errors"], {"email": ["Already taken."]})

    def test_validation_error_plain_string_goes_to_non_field(self):
        exc = ValidationError("Only playlists can be deleted.")
        response = self._handle(exc)
        self.assertEqual(response.data["detail"], "Only playlists can be deleted.")
        self.assertEqual(response.data["code"], "invalid")
        self.assertEqual(
            response.data["errors"], {"non_field": ["Only playlists can be deleted."]}
        )

    def test_validation_error_list_goes_to_non_field(self):
        exc = ValidationError(["one", "two"])
        response = self._handle(exc)
        self.assertEqual(response.data["errors"], {"non_field": ["one", "two"]})
        self.assertEqual(response.data["detail"], "one")

    def test_not_found(self):
        response = self._handle(NotFound())
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["detail"], "Not found.")
        self.assertEqual(response.data["code"], "not_found")
        self.assertEqual(response.data["errors"], {})

    def test_permission_denied(self):
        response = self._handle(PermissionDenied())
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "permission_denied")
        self.assertEqual(response.data["errors"], {})

    def test_not_authenticated(self):
        response = self._handle(NotAuthenticated())
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["code"], "not_authenticated")
        self.assertEqual(response.data["errors"], {})

    def test_throttled_preserves_retry_after_header(self):
        response = self._handle(Throttled(wait=42))
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data["code"], "throttled")
        self.assertEqual(response["Retry-After"], "42")
