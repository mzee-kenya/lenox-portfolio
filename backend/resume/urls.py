from django.urls import path
from rest_framework.routers import DefaultRouter

from resume import views

app_name = "resume"

router = DefaultRouter()
# More specific prefixes are registered first so their patterns resolve before
# the generic `resume` detail pattern catches every single-segment path.
router.register(r"resume/versions", views.ResumeVersionViewSet, basename="resume-version")
router.register(r"resume/sections", views.ResumeSectionViewSet, basename="resume-section")
router.register(r"resume", views.ResumeViewSet, basename="resume")

urlpatterns = [
    path("resume/preview/", views.resume_preview, name="resume-preview"),
    path("resume/preview/<slug:version_slug>/", views.resume_preview, name="resume-preview-version"),
    path("resume/pdf/", views.resume_pdf, name="resume-pdf"),
    path("resume/pdf/<slug:version_slug>/", views.resume_pdf, name="resume-pdf-version"),
]

urlpatterns += router.urls