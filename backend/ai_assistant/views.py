from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_assistant import services
from ai_assistant.models import ResumeAnalysis
from contact.serializers import sanitize_text


class AnalyzeSerializer(serializers.Serializer):
    job_description = serializers.CharField(max_length=20000, min_length=80)
    resume_version = serializers.SlugField(required=False, allow_blank=True, default="")
    session_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate_job_description(self, value):
        cleaned = sanitize_text(value)
        if len(cleaned) < 80:
            raise serializers.ValidationError("Paste the full job description so the match analysis is meaningful.")
        return cleaned


class AssistSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["improve_summary", "tailored_summary", "project_bullets", "ats_keywords"]
    )
    job_description = serializers.CharField(required=False, allow_blank=True, max_length=20000)
    resume_version = serializers.SlugField(required=False, allow_blank=True, default="")
    project_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        action = attrs["action"]
        if action in {"tailored_summary", "ats_keywords"} and not attrs.get("job_description"):
            raise serializers.ValidationError({"job_description": "Required for this action."})
        if action == "project_bullets" and not attrs.get("project_id"):
            raise serializers.ValidationError({"project_id": "Required for this action."})
        if attrs.get("job_description"):
            attrs["job_description"] = sanitize_text(attrs["job_description"])
        return attrs


class AssistView(APIView):
    """Owner-only rewriting actions grounded in the resume (improve/tailor bullets)."""

    throttle_scope = "ai"
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AssistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            if data["action"] == "improve_summary":
                payload = services.improve_summary(request.data.get("summary") or "", data.get("resume_version") or None)
            elif data["action"] == "tailored_summary":
                payload = services.tailored_summary(data["job_description"], data.get("resume_version") or None)
            elif data["action"] == "project_bullets":
                payload = services.project_bullets(data["project_id"])
            else:
                payload = services.ats_keywords(data["job_description"], data.get("resume_version") or None)
        except Exception:
            return Response(
                {"ok": False, "error": {"code": "ai_error", "detail": "The assistant could not complete this task. Please try again."}},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"ok": True, "result": payload})


class AnalyzeView(APIView):
    """Public job-match endpoint — rate limited, guest-safe, no account required."""

    throttle_scope = "ai"
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AnalyzeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = services.run_analysis(
                data["job_description"],
                data.get("resume_version") or None,
                data.get("session_id") or "",
            )
        except ValueError as exc:
            return Response(
                {"ok": False, "error": {"code": "invalid_request", "detail": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"ok": True, "result": result})


class HistoryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        qs = ResumeAnalysis.objects.select_related("job_description")
        if session_id:
            qs = qs.filter(job_description__session_id=session_id)[:20]
        else:
            qs = qs.all()[:50]
        return Response(
            [
                {
                    "id": a.pk,
                    "score": a.score,
                    "provider": a.provider,
                    "created_at": a.created_at.isoformat(),
                    "job_excerpt": (a.job_description.content or "")[:120],
                }
                for a in qs
            ]
        )