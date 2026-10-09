from django.contrib import admin

from projects import models


class ProjectTechnologyInline(admin.TabularInline):
    model = models.ProjectTechnology
    extra = 1


class ProjectFeatureInline(admin.TabularInline):
    model = models.ProjectFeature
    extra = 1


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "status", "featured", "published", "order")
    list_filter = ("status", "featured", "published", "category")
    search_fields = ("name", "description", "problem", "solution")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProjectTechnologyInline, ProjectFeatureInline]


@admin.register(models.Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    search_fields = ("name",)


@admin.register(models.CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ("project",)
    search_fields = ("project__name",)