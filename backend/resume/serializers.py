from rest_framework import serializers

from resume.models import Resume, ResumeSection, ResumeVersion


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "profile",
            "summary",
            "email",
            "phone",
            "location",
            "website",
            "references_note",
            "is_active",
        ]


class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = ["id", "slug", "title", "target_role", "summary", "emphasis", "is_default", "enabled", "order"]


class ResumeSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeSection
        fields = ["id", "key", "version", "title", "enabled", "order", "data"]