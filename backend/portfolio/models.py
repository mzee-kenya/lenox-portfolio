from django.db import models


class SkillCategory(models.TextChoices):
    FRONTEND = "frontend", "Frontend"
    BACKEND = "backend", "Backend"
    DATABASE = "database", "Database"
    MOBILE = "mobile", "Mobile"
    TOOLS = "tools", "Tools"
    ENGINEERING = "engineering", "Engineering"
    OTHER = "other", "Other"


class Skill(models.Model):
    name = models.CharField(max_length=120, unique=True)
    category = models.CharField(max_length=40, choices=SkillCategory.choices)
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "order", "name"]

    def __str__(self):
        return self.name


class Profile(models.Model):
    """Singleton-style profile powering the whole site, resume and AI systems."""

    name = models.CharField(max_length=120, default="Lenox Okoth")
    title = models.CharField(max_length=160, default="Full-Stack Software Engineer")
    brand = models.CharField(max_length=80, default="Lentech")
    role_tagline = models.CharField(max_length=240, default="")
    summary = models.TextField(default="")

    about = models.TextField(default="")
    location = models.CharField(max_length=160, default="Kenya")
    email = models.EmailField(max_length=200, default="")
    phone = models.CharField(max_length=60, blank=True, default="")
    photo = models.CharField(max_length=500, blank=True, default="", help_text="Public URL of the profile photo.")

    github_url = models.URLField(blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")
    website_url = models.URLField(blank=True, default="")

    meta_title = models.CharField(max_length=160, blank=True, default="")
    meta_description = models.CharField(max_length=320, blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self):
        return self.name


class Experience(models.Model):
    title = models.CharField(max_length=200)
    organization = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=60, blank=True, default="")
    location = models.CharField(max_length=160, blank=True, default="")
    start_date = models.CharField(max_length=40, default="")
    end_date = models.CharField(max_length=40, blank=True, default="")
    current = models.BooleanField(default=False)
    description = models.TextField(default="", help_text="Line-separated bullet points.")
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.title} @ {self.organization}"


class Education(models.Model):
    school = models.CharField(max_length=200)
    degree = models.CharField(max_length=200)
    field = models.CharField(max_length=200, blank=True, default="")
    start_date = models.CharField(max_length=40, default="")
    end_date = models.CharField(max_length=40, blank=True, default="")
    current = models.BooleanField(default=False)
    detail = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.degree} — {self.school}"


class Certification(models.Model):
    name = models.CharField(max_length=240)
    issuer = models.CharField(max_length=200, blank=True, default="")
    issue_date = models.CharField(max_length=40, blank=True, default="")
    credential_url = models.URLField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class SocialLink(models.Model):
    label = models.CharField(max_length=60)
    url = models.URLField()
    icon = models.CharField(max_length=40, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.label}: {self.url}"


class AnalyticEvent(models.Model):
    """Anonymous usage events. No personal data is ever collected."""

    name = models.CharField(max_length=80, db_index=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name