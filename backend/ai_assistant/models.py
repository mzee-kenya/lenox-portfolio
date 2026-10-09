from django.db import models

from resume.models import ResumeVersion


class JobDescription(models.Model):
    content = models.TextField()
    session_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        preview = self.content[:80].replace("\n", " ")
        return f"JD {self.pk}: {preview}…"


class ResumeAnalysis(models.Model):
    job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name="analyses")
    resume_version = models.ForeignKey(
        ResumeVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analyses",
    )
    provider = models.CharField(max_length=40, default="local")
    score = models.PositiveIntegerField(default=0)
    breakdown = models.JSONField(default=dict, blank=True)
    matched = models.JSONField(default=list, blank=True)
    missing = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Analysis #{self.pk} ({self.score}%)"