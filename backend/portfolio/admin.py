from django.contrib import admin

from portfolio import models


@admin.register(models.Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "active", "order")
    list_filter = ("category", "active")
    search_fields = ("name",)


@admin.register(models.Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "title", "location", "email")
    search_fields = ("name", "title", "email")


@admin.register(models.Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "current", "order", "active")
    list_filter = ("current", "active")


@admin.register(models.Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ("degree", "school", "current", "order", "active")
    list_filter = ("current", "active")


@admin.register(models.Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ("name", "issuer", "issue_date", "order", "active")
    list_filter = ("active",)


@admin.register(models.SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ("label", "url", "order", "active")
    list_filter = ("active",)


@admin.register(models.AnalyticEvent)
class AnalyticEventAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    list_filter = ("name", "created_at")
    readonly_fields = ("name", "meta", "created_at")