from collections.abc import Mapping, Sequence

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

NON_FIELD_KEY = "non_field"
GENERIC_FIELD_DETAIL = "Some fields are invalid."


def musikk_exception_handler(exc: Exception, context: dict) -> Response | None:
    """Reshape DRF error responses into a single canonical body.

    Body shape: ``{"detail": str, "code": str, "errors": dict[str, list[str]]}``.
    Returning ``None`` lets Django produce a 500 for unhandled Python exceptions
    -- DRF only handles its own ``APIException`` subclasses plus ``Http404`` and
    ``PermissionDenied``.
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, ValidationError):
        errors = _flatten_validation_detail(exc.detail)
        non_field = errors.get(NON_FIELD_KEY)
        detail = non_field[0] if non_field else GENERIC_FIELD_DETAIL
        code = getattr(exc, "default_code", "invalid")
    else:
        detail = _stringify_detail(getattr(exc, "detail", str(exc)))
        errors = {}
        code = getattr(exc, "default_code", "error")

    response.data = {"detail": detail, "code": code, "errors": errors}
    return response


def _flatten_validation_detail(detail: object) -> dict[str, list[str]]:
    if isinstance(detail, Mapping):
        out: dict[str, list[str]] = {}
        for key, value in detail.items():
            target = NON_FIELD_KEY if key == "non_field_errors" else str(key)
            out[target] = _flatten_messages(value)
        return out
    return {NON_FIELD_KEY: _flatten_messages(detail)}


def _flatten_messages(value: object) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, Mapping):
        out: list[str] = []
        for v in value.values():
            out.extend(_flatten_messages(v))
        return out
    if isinstance(value, Sequence):
        out = []
        for item in value:
            out.extend(_flatten_messages(item))
        return out
    return [str(value)]


def _stringify_detail(detail: object) -> str:
    if isinstance(detail, str):
        return detail
    if isinstance(detail, Sequence) and not isinstance(detail, (str, bytes)):
        for item in detail:
            return _stringify_detail(item)
    if isinstance(detail, Mapping):
        for v in detail.values():
            return _stringify_detail(v)
    return str(detail)
