"""Shared API-level helpers: health, public configuration, capability flags."""
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(["GET"])
@permission_classes([AllowAny])
def healthcheck(request):
    return JsonResponse({"status": "ok", "service": "lenox-portfolio-api"})


@api_view(["GET"])
@permission_classes([AllowAny])
def site_config(request):
    """Public, non-secret configuration consumed by the frontend at boot."""
    return JsonResponse(
        {
            "siteName": "Lenox Okoth",
            "title": "Full-Stack Software Engineer",
            "apiBase": "/api",
            "resumeVersionsHint": "See /api/resume/versions/",
            "features": {
                "aiAssistant": bool(settings.AI_API_KEY),
                "contactForm": True,
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def ai_status(request):
    """
    The assistant always works because a deterministic local engine ships with
    the app; an LLM provider only enhances phrasing when configured.
    """
    from ai_assistant.services import provider_name

    return JsonResponse({"available": True, "provider": provider_name()})


def spa_index(request):
    """Serve the built React single-page app for any non-API client route."""
    index = Path(settings.SPA_DIR) / "index.html"
    if not index.exists():
        raise Http404("Frontend build not found. Run `npm run build` and copy dist into backend/spa.")
    return FileResponse(open(index, "rb"), content_type="text/html")
