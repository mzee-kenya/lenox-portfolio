from rest_framework import serializers

from portfolio.models import (
    AnalyticEvent,
    Certification,
    Education,
    Experience,
    Profile,
    Skill,
    SkillCategory,
    SocialLink,
)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "category", "order", "active"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "id",
            "name",
            "title",
            "brand",
            "role_tagline",
            "summary",
            "about",
            "location",
            "email",
            "phone",
            "photo",
            "github_url",
            "linkedin_url",
            "website_url",
            "meta_title",
            "meta_description",
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ["id", "title", "organization", "employment_type", "location", "start_date", "end_date", "current", "description", "order", "active"]


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ["id", "school", "degree", "field", "start_date", "end_date", "current", "detail", "order", "active"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name", "issuer", "issue_date", "credential_url", "order", "active"]


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ["id", "label", "url", "icon", "order", "active"]


class AnalyticEventSerializer(serializers.Serializer):
    name = serializers.ChoiceField(choices=["resume_download", "project_view", "contact_submit", "github_click"])
    meta = serializers.JSONField(required=False, default=dict)