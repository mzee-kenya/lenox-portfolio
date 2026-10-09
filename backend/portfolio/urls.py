from django.urls import path
from rest_framework.routers import DefaultRouter

from portfolio import views

app_name = "portfolio"

router = DefaultRouter()
router.register(r"skills", views.SkillViewSet, basename="skill")
router.register(r"profile", views.ProfileViewSet, basename="profile")
router.register(r"experience", views.ExperienceViewSet, basename="experience")
router.register(r"education", views.EducationViewSet, basename="education")
router.register(r"certifications", views.CertificationViewSet, basename="certification")
router.register(r"links", views.SocialLinkViewSet, basename="link")

urlpatterns = [
    path("content/", views.site_content, name="site-content"),
    path("events/", views.track_event, name="track-event"),
] + router.urls
