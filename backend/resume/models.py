from django.db import models

from portfolio.models import Profile


class Resume(models.Model):
    """Top-level resume document (one per profile) with contact overrides."""

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="resume")
    summary = models.TextField(default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=60, blank=True, default="")
    location = models.CharField(max_length=160, blank=True, default="")
    website = models.URLField(blank=True, default="")
    references_note = models.CharField(max_length=240, blank=True, default="References available on request.")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Resume — {self.profile.name}"


class ResumeVersion(models.Model):
    """A focused resume variant (Full-Stack / Frontend / Backend)."""

    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="versions")
    slug = models.SlugField(max_length=60, unique=True)
    title = models.CharField(max_length=120)
    target_role = models.CharField(max_length=160, blank=True, default="")
    summary = models.TextField(blank=True, default="", help_text="Overrides the base resume summary.")
    emphasis = models.JSONField(
        default=list,
        blank=True,
        help_text='List of skill names to list first, e.g. ["React", "Django", "PostgreSQL"].',
    )
    is_default = models.BooleanField(default=False)
    enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class ResumeSection(models.Model):
    """Optional per-version overrides for a logical resume block.

    Sections are mostly derived from portfolio data; this model exists so a
    version can reorder / filter / relabel a block without touching code.
    """

    class Key(models.TextChoices):
        SUMMARY = "summary", "Summary"
        SKILLS = "skills", "Skills"
        EXPERIENCE = "experience", "Experience"
        EDUCATION = "education", "Education"
        CERTIFICATIONS = "certifications", "Certifications"
        PROJECTS = "projects", "Projects"
        LINKS = "links", "Links"

    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="sections")
    version = models.ForeignKey(
        ResumeVersion,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sections",
    )
    key = models.CharField(max_length=30, choices=Key.choices)
    title = models.CharField(max_length=120, blank=True, default="")
    enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    data = models.JSONField(default=dict, blank=True, help_text="Optional {include:[ids], order:[ids]} filters.")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.key} ({self.version.title if self.version else 'base'})"