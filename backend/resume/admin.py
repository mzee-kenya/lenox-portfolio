from django.contrib import admin

from resume import models


class ResumeVersionInline(admin.TabularInline):
    model = models.ResumeVersion
    extra = 1


class ResumeSectionInline(admin.TabularInline):
    model = models.ResumeSection
    extra = 0


@admin.register(models.Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("profile", "is_active")
    inlines = [ResumeVersionInline, ResumeSectionInline]


@admin.register(models.ResumeVersion)
class ResumeVersionAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_default", "enabled", "order")
    list_filter = ("enabled", "is_default")
    search_fields = ("title", "slug")


@admin.register(models.ResumeSection)
class ResumeSectionAdmin(admin.ModelAdmin):
    list_display = ("resume", "key", "version", "title", "enabled", "order")
    list_filter = ("key", "enabled")