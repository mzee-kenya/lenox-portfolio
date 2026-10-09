from django.db import transaction
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

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
from portfolio.serializers import (
    AnalyticEventSerializer,
    CertificationSerializer,
    EducationSerializer,
    ExperienceSerializer,
    ProfileSerializer,
    SkillSerializer,
    SocialLinkSerializer,
)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class SkillViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ["name"]


class ProfileViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_object(self):
        obj = Profile.objects.first()
        if obj is None:
            obj = Profile.objects.create()
        return obj

    def list(self, request):
        return Response(self.get_serializer(self.get_object()).data)


class ExperienceViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer
    permission_classes = [IsStaffOrReadOnly]


class EducationViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer
    permission_classes = [IsStaffOrReadOnly]


class CertificationViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [IsStaffOrReadOnly]


class SocialLinkViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = SocialLink.objects.all()
    serializer_class = SocialLinkSerializer
    permission_classes = [IsStaffOrReadOnly]


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def site_content(request):
    """One request powers the homepage and any static pages.

    Public, read-only data. Write access to individual resources is handled by
    the dedicated staff endpoints under /api/.
    """
    if request.method == "POST":
        data = {
            "ok": False,
            "error": {"code": "method_not_allowed", "detail": "Content is read-only. Use the admin endpoints to update data."},
        }
        return Response(data, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    skills = Skill.objects.filter(active=True)
    profile = Profile.objects.first()

    from projects.models import Project

    projects = Project.objects.filter(published=True)
    projects_data = []
    for p in projects:
        projects_data.append(
            {
                "name": p.name,
                "slug": p.slug,
                "tagline": p.tagline,
                "category": p.category,
                "status": p.status,
                "description": p.description,
                "problem": p.problem,
                "solution": p.solution,
                "role": p.role,
                "image_url": p.image_url,
                "github_url": p.github_url,
                "demo_url": p.demo_url,
                "featured": p.featured,
                "order": p.order,
                "started_at": p.started_at,
                "technologies": [pt.technology.name for pt in p.technologies.all()],
                "features": [{"text": f.text, "status": f.status, "order": f.order} for f in p.features.all()],
            }
        )
    projects_data.sort(key=lambda x: (not x["featured"], x["order"]))

    payload = {
        "profile": ProfileSerializer(profile).data if profile else None,
        "skills": [
            {
                "category": c,
                "categoryLabel": SkillCategory(c).label if c in SkillCategory.values else c,
                "items": SkillSerializer([s for s in skills if s.category == c], many=True).data,
            }
            for c in SkillCategory.values
        ],
        "experience": ExperienceSerializer(Experience.objects.filter(active=True), many=True).data,
        "education": EducationSerializer(Education.objects.filter(active=True), many=True).data,
        "certifications": CertificationSerializer(Certification.objects.filter(active=True), many=True).data,
        "social_links": SocialLinkSerializer(SocialLink.objects.filter(active=True), many=True).data,
        "projects": projects_data,
        "meta": {
            "title": profile.meta_title if profile and profile.meta_title else None,
            "description": profile.meta_description if profile and profile.meta_description else None,
        },
    }
    return Response(payload)


@api_view(["POST"])
@permission_classes([AllowAny])
def track_event(request):
    """Anonymous usage events for lightweight, privacy-first analytics."""
    serializer = AnalyticEventSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    AnalyticEvent.objects.create(name=serializer.validated_data["name"], meta=serializer.validated_data.get("meta") or {})
    return Response({"ok": True})