import re

from django.core.validators import MaxLengthValidator, RegexValidator
from rest_framework import serializers

from contact.models import ContactMessage

_ALLOWED_NAME = RegexValidator(r"^[\w \.'\-]{2,120}$", "Please enter a valid name (letters, spaces, and basic punctuation only).", re.UNICODE)
_TAG_STRIP = re.compile(r"<[^>]*>")


def sanitize_text(value):
    """Strip HTML-ish tags and dangerous control characters at the boundary."""
    text = _TAG_STRIP.sub("", value or "")
    text = "".join(ch for ch in text if ch not in "\x00\x0b\x0c\x1b" or ch in "\n\r\t")
    return text.strip()


class ContactMessageCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, validators=[_ALLOWED_NAME])
    email = serializers.EmailField(max_length=200)
    subject = serializers.CharField(max_length=160)
    message = serializers.CharField(max_length=5000, min_length=20)
    # Honeypot: real users never see this field. Bots that fill it are dropped.
    website = serializers.CharField(required=False, allow_blank=True, default="")
    consent = serializers.BooleanField(default=False)

    def validate_name(self, value):
        cleaned = sanitize_text(value)
        if len(cleaned) < 2:
            raise serializers.ValidationError("Please enter your name.")
        return cleaned

    def validate_email(self, value):
        cleaned = sanitize_text(value).lower()
        if len(cleaned) > 200:
            raise serializers.ValidationError("Email address is too long.")
        return cleaned

    def validate_subject(self, value):
        cleaned = sanitize_text(value)
        if len(cleaned) < 3:
            raise serializers.ValidationError("Subject is too short.")
        return cleaned

    def validate_message(self, value):
        cleaned = sanitize_text(value)
        if len(cleaned) < 20:
            raise serializers.ValidationError("Message must be at least 20 characters.")
        return cleaned

    def validate(self, attrs):
        if attrs.get("website"):
            raise serializers.ValidationError("This request was blocked as spam.")
        attrs.pop("website", None)
        # Require an explicit consent flag so we never store data by accident.
        if not attrs.get("consent"):
            raise serializers.ValidationError({"consent": "Please agree to be contacted before submitting."})
        return attrs


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "status", "created_at"]
        read_only_fields = ["name", "email", "subject", "message", "created_at"]