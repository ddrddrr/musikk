import re

from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import extend_schema

NO_CONTENT_SCHEMA = extend_schema(request=None, responses={204: None})
"""
Schema for an action that takes no body and answers with 204. Many like, follow
and player actions work this way, and the generator cannot see it from a plain
`APIView`.
"""


class MusikkAutoSchema(AutoSchema):
    """
    Adds the path variable names to the operation id. Some views serve two URLs
    that differ only in a path variable, such as `feed/posts` and
    `feed/<uuid>/posts`. The default id leaves path variables out, so both URLs
    would get the same id.
    """

    def get_operation_id(self) -> str:
        operation_id = super().get_operation_id()
        variables = re.findall(r"\{(\w+)\}", self.path)
        if not variables:
            return operation_id
        return "_".join([operation_id, "by", *variables])


def require_response_fields(result: dict, generator, request, public) -> dict:
    """
    A postprocessing hook. DRF writes every readable field into a response, but
    the generator marks a field as required only when it is read-only or
    required on input. Without this hook a field with a model default, such as
    `is_deleted`, would be optional in the frontend types. Request components
    end in "Request" and keep the generator's choice, because a client may
    leave out a field that has a default.
    """
    for name, component in result["components"]["schemas"].items():
        if name.endswith("Request") or "properties" not in component:
            continue
        component["required"] = sorted(component["properties"])
    return result
