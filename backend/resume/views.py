from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from portfolio.views import IsStaffOrReadOnly
from resume.models import Resume, ResumeSection, ResumeVersion
from resume.renderer import build_payload, build_pdf
from resume.serializers import (
    ResumeSectionSerializer,
    ResumeSerializer,
    ResumeVersionSerializer,
)


class ResumeViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_object(self):
        resume = Resume.objects.first()
        if resume is None:
            return Resume.objects.create(profile=_ensure_profile())
        return resume

    def list(self, request):
        return Response(self.get_serializer(self.get_object()).data)


class ResumeVersionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = ResumeVersionSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        qs = ResumeVersion.objects.all()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(enabled=True)
        return qs

    def perform_create(self, serializer):
        resume = Resume.objects.first() or _ensure_resume()
        serializer.save(resume=resume)

    def perform_destroy(self, instance):
        if instance.is_default:
            return Response({"detail": "Cannot delete the default resume version."}, status=status.HTTP_400_BAD_REQUEST)
        instance.delete()


class ResumeSectionViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = ResumeSection.objects.all()
    serializer_class = ResumeSectionSerializer
    permission_classes = [IsStaffOrReadOnly]

    def perform_create(self, serializer):
        resume = Resume.objects.first() or _ensure_resume()
        serializer.save(resume=resume)


def _ensure_profile():
    from portfolio.models import Profile

    return Profile.objects.first() or Profile.objects.create()


def _ensure_resume():
    return Resume.objects.first() or Resume.objects.create(profile=_ensure_profile())


@api_view(["GET"])
@permission_classes([AllowAny])
def resume_preview(request, version_slug=None):
    return Response(build_payload(version_slug))


@api_view(["GET"])
@permission_classes([AllowAny])
def resume_pdf(request, version_slug=None):
    try:
        pdf_bytes = build_pdf(version_slug)
    except ValueError:
        return Response({"detail": "No profile configured."}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({"detail": "Resume generation failed. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    filename = "Lenox-Okoth-Resume.pdf"
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Content-Length"] = str(len(pdf_bytes))
    return response