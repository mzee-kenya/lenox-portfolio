from django.urls import path
from rest_framework.routers import DefaultRouter

from contact import views

app_name = "contact"

router = DefaultRouter()
router.register(r"contact/messages", views.ContactMessageViewSet, basename="contact-message")

urlpatterns = [
    path("contact/", views.SendMessageView.as_view(), name="send-message"),
]

urlpatterns += router.urls