from django.db import models

from portfolio.models import Skill


class Project(models.Model):
    class Status(models.TextChoices):
        IMPLEMENTED = "implemented", "Implemented"
        IN_PROGRESS = "in_progress", "In Development"
        PLANNED = "planned", "Planned"

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    tagline = models.CharField(max_length=240, default="")
    category = models.CharField(max_length=120, default="Full-Stack")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IMPLEMENTED)
    description = models.TextField(default="")
    problem = models.TextField(default="")
    solution = models.TextField(default="")
    role = models.CharField(max_length=240, default="")
    architecture = models.TextField(
        blank=True,
        default="",
        help_text="Explain the system architecture: frontend, API, backend, database and data flow.",
    )
    image_url = models.CharField(max_length=500, blank=True, default="")
    github_url = models.URLField(blank=True, default="")
    demo_url = models.URLField(blank=True, default="")
    featured = models.BooleanField(default=False)
    published = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    started_at = models.CharField(max_length=40, blank=True, default="")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Technology(models.Model):
    name = models.CharField(max_length=120, unique=True)
    category = models.CharField(max_length=40, default="tools")

    class Meta:
        verbose_name_plural = "Technologies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProjectTechnology(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="technologies")
    technology = models.ForeignKey(Technology, on_delete=models.CASCADE, related_name="project_uses")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = ("project", "technology")

    def __str__(self):
        return f"{self.project.name} — {self.technology.name}"


class ProjectFeature(models.Model):
    class Status(models.TextChoices):
        IMPLEMENTED = "implemented", "Implemented"
        IN_PROGRESS = "in_progress", "In Development"
        PLANNED = "planned", "Planned"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="features")
    text = models.CharField(max_length=240)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IMPLEMENTED)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.text


class CaseStudy(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="case_study")
    architecture_text = models.TextField(blank=True, default="")
    challenges = models.JSONField(default=list, blank=True, help_text="List of strings / objects.")
    solutions = models.JSONField(default=list, blank=True)
    results = models.JSONField(default=list, blank=True)
    lessons = models.JSONField(default=list, blank=True)
    decisions = models.JSONField(default=list, blank=True, help_text="Key architectural decisions.")

    class Meta:
        verbose_name_plural = "Case Studies"

    def __str__(self):
        return f"{self.project.name} case study"