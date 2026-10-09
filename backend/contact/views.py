import logging

from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from contact.models import ContactMessage
from contact.serializers import ContactMessageAdminSerializer, ContactMessageCreateSerializer

logger = logging.getLogger(__name__)

MAX_UA_LENGTH = 400


class SendMessageView(APIView):
    """Public contact endpoint — validated, sanitized and rate limited on the backend."""

    throttle_scope = "contact"
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip = request.META.get("REMOTE_ADDR")
        if not ip or ip in {"127.0.0.1", "::1", "localhost"}:
            ip = None
        ua = (request.META.get("HTTP_USER_AGENT") or "")[:MAX_UA_LENGTH]

        message = ContactMessage.objects.create(
            name=data["name"],
            email=data["email"],
            subject=data["subject"],
            message=data["message"],
            ip_address=ip,
            user_agent=ua,
        )
        logger.info("Contact message #%s from %s", message.pk, data["email"])
        return Response({"ok": True, "id": message.pk}, status=status.HTTP_201_CREATED)


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ["name", "email", "subject", "message"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter in dict(ContactMessage.Status.choices):
            qs = qs.filter(status=status_filter)
        return qs

    def perform_update(self, serializer):
        allowed = {"status"}
        for key in list(serializer.validated_data.keys()):
            if key not in allowed:
                serializer.validated_data.pop(key)
        super().perform_update(serializer)
