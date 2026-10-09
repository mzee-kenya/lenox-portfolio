"""Centralized API error handling so clients always receive a stable JSON shape."""
import logging

from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _flatten(errors):
    """DRF field errors -> a flat, human readable message."""
    if isinstance(errors, dict):
        parts = []
        for key, value in errors.items():
            if isinstance(value, (list, tuple)):
                parts.append(f"{key}: {' '.join(str(v) for v in value)}")
            else:
                parts.append(f"{key}: {value}")
        return "; ".join(parts)
    if isinstance(errors, (list, tuple)):
        return "; ".join(str(e) for e in errors)
    return str(errors)


def api_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        exc = APIException(_flatten(exc.message_dict if hasattr(exc, "message_dict") else exc.messages))
        exc.status_code = status.HTTP_400_BAD_REQUEST

    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API error: %s", exc)
        return Response(
            {"ok": False, "error": {"code": "server_error", "detail": "Something went wrong. Please try again."}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, PermissionDenied):
        code = "forbidden"
    elif response.status_code == status.HTTP_404_NOT_FOUND:
        code = "not_found"
    elif response.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "unauthorized"
    elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        code = "rate_limited"
    elif response.status_code >= 400:
        code = "invalid_request"
    else:
        code = "error"

    detail = response.data.get("detail", None) if isinstance(response.data, dict) else None
    if detail is None:
        detail = _flatten(response.data) if isinstance(response.data, (dict, list)) else str(response.data)

    response.data = {"ok": False, "error": {"code": code, "detail": detail}}
    return response
