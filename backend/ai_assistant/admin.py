from django.contrib import admin

from ai_assistant import models


@admin.register(models.JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ("pk", "created_at", "session_id")
    list_filter = ("created_at",)
    search_fields = ("content",)


@admin.register(models.ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("pk", "provider", "score", "created_at")
    list_filter = ("provider",)