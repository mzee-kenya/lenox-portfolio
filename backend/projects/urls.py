from django.urls import path
from rest_framework.routers import DefaultRouter

from projects import views

app_name = "projects"

router = DefaultRouter()
router.register(r"projects", views.ProjectViewSet, basename="project")
router.register(r"technologies", views.TechnologyViewSet, basename="technology")

urlpatterns = router.urls