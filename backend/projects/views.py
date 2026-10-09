from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from portfolio.views import IsStaffOrReadOnly
from projects.models import Project, Technology
from projects.serializers import (
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
    TechnologySerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [IsStaffOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in permissions.SAFE_METHODS:
            return ProjectDetailSerializer if self.action == "retrieve" else ProjectListSerializer
        return ProjectWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("features", "technologies", "case_study")
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(published=True)
        return qs

    @action(detail=False, methods=["get"])
    def featured(self, request):
        qs = self.get_queryset().filter(featured=True)
        return Response(ProjectDetailSerializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        from django.http import Http404

        try:
            instance = self.get_object()
        except Http404:
            instance = self.get_queryset().filter(slug=kwargs.get("pk")).first()
            if instance is None:
                raise Http404("No project matches the given query.")
        return Response(ProjectDetailSerializer(instance).data)


class TechnologyViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Technology.objects.all()
    serializer_class = TechnologySerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ["name"]