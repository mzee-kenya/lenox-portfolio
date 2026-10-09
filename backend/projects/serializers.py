from rest_framework import serializers

from projects.models import CaseStudy, Project, ProjectFeature, ProjectTechnology, Technology


class TechnologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Technology
        fields = ["id", "name", "category"]


class ProjectFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFeature
        fields = ["id", "text", "status", "order"]


class ProjectListSerializer(serializers.ModelSerializer):
    technologies = serializers.SerializerMethodField()

    def get_technologies(self, obj):
        return [pt.technology.name for pt in obj.technologies.all()]

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "category",
            "status",
            "description",
            "problem",
            "solution",
            "role",
            "image_url",
            "github_url",
            "demo_url",
            "featured",
            "order",
            "started_at",
            "technologies",
        ]


class ProjectDetailSerializer(ProjectListSerializer):
    features = ProjectFeatureSerializer(many=True, read_only=True)
    case_study = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ["architecture", "features", "case_study", "published"]

    def get_case_study(self, obj):
        cs = getattr(obj, "case_study", None)
        if cs is None:
            return None
        return {
            "architecture_text": cs.architecture_text,
            "challenges": cs.challenges,
            "solutions": cs.solutions,
            "results": cs.results,
            "lessons": cs.lessons,
            "decisions": cs.decisions,
        }


class ProjectWriteSerializer(serializers.ModelSerializer):
    """Staff write serializer supporting nested technology names and features."""

    technologies = serializers.ListField(child=serializers.CharField(max_length=120), write_only=True, required=False)
    features = ProjectFeatureSerializer(many=True, required=False)
    challenge_list = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    solution_list = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    result_list = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    lesson_list = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "category",
            "status",
            "description",
            "problem",
            "solution",
            "role",
            "architecture",
            "image_url",
            "github_url",
            "demo_url",
            "featured",
            "published",
            "order",
            "started_at",
            "technologies",
            "features",
            "challenge_list",
            "solution_list",
            "result_list",
            "lesson_list",
        ]

    def validate_status(self, value):
        if value not in dict(Project.Status.choices):
            raise serializers.ValidationError("Unknown project status.")
        return value

    def _save_case_study(self, project, validated):
        data = {
            "architecture_text": validated.get("architecture", project.architecture or ""),
            "challenges": validated.get("challenge_list") or [],
            "solutions": validated.get("solution_list") or [],
            "results": validated.get("result_list") or [],
            "lessons": validated.get("lesson_list") or [],
        }
        CaseStudy.objects.update_or_create(project=project, defaults=data)

    def create(self, validated):
        tech_names = validated.pop("technologies", [])
        features = validated.pop("features", [])
        project = Project.objects.create(**validated)
        self._set_technologies(project, tech_names)
        for i, f in enumerate(features):
            ProjectFeature.objects.create(project=project, text=f["text"].strip(), status=f.get("status", "implemented"), order=i)
        self._save_case_study(project, validated)
        return project

    def update(self, instance, validated):
        tech_names = validated.pop("technologies", None)
        features = validated.pop("features", None)
        for attr, value in validated.items():
            setattr(instance, attr, value)
        instance.save()
        if tech_names is not None:
            self._set_technologies(instance, tech_names)
        if features is not None:
            instance.features.all().delete()
            for i, f in enumerate(features):
                ProjectFeature.objects.create(project=instance, text=f["text"].strip(), status=f.get("status", "implemented"), order=i)
        self._save_case_study(instance, validated)
        return instance

    def _set_technologies(self, project, tech_names):
        project.technologies.all().delete()
        for order, name in enumerate(tech_names):
            name = name.strip()
            if not name:
                continue
            tech, _ = Technology.objects.get_or_create(name=name)
            ProjectTechnology.objects.create(project=project, technology=tech, order=order)