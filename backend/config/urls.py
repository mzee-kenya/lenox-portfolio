"""URL configuration for the portfolio API."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from config.views import ai_status, healthcheck, site_config

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="healthcheck"),
    path("api/config/", site_config, name="site-config"),
    path("api/ai/status/", ai_status, name="ai-status"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("portfolio.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("resume.urls")),
    path("api/", include("contact.urls")),
    path("api/", include("ai_assistant.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
