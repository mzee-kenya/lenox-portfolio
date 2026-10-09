"""
Resume rendering.

Two outputs are produced from one verified data model so the online preview and
the downloadable PDF always agree:

  * build_payload() -> JSON consumed by the browser (online preview, AI tools)
  * build_pdf()     -> ATS-friendly single-column PDF via ReportLab

Nothing here invents facts: every word comes from portfolio models the owner
maintains through the admin dashboard.
"""

import logging
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from portfolio.models import (
    Certification,
    Education,
    Experience,
    Profile,
    Skill,
    SocialLink,
)
from projects.models import Project
from resume.models import Resume, ResumeSection, ResumeVersion

logger = logging.getLogger(__name__)

# Category display order used on the resume.
CATEGORY_ORDER = ["frontend", "backend", "database", "mobile", "tools", "engineering", "other"]
CATEGORY_LABELS = {
    "frontend": "Frontend",
    "backend": "Backend",
    "database": "Database",
    "mobile": "Mobile",
    "tools": "Tools & Workflow",
    "engineering": "Engineering",
    "other": "Additional",
}


def _section_overrides(version, key):
    """Return include[]/order[] filters (if any) defined for a version block."""
    filters = ResumeSection.objects.filter(version=version, key=key, enabled=True).first()
    if not filters:
        return {}, None
    data = filters.data or {}
    return data, (filters.title or None)


def build_payload(version_slug=None):
    profile = Profile.objects.first()
    resume = getattr(profile, "resume", None) if profile else None
    versions = list(ResumeVersion.objects.filter(enabled=True))
    if not versions:
        versions = []

    version = None
    if version_slug:
        version = ResumeVersion.objects.filter(slug=version_slug, enabled=True).first()
    elif versions:
        version = next((v for v in versions if v.is_default), versions[0])

    if profile is None:
        return {"profile": None, "resume": None, "version": None, "sections": {}}

    summary = (version.summary if version and version.summary else "")
    if not summary:
        summary = resume.summary if resume else profile.summary

    email = (resume.email if resume and resume.email else profile.email) if resume or profile else ""
    phone = resume.phone if resume and resume.phone else profile.phone
    location = resume.location if resume and resume.location else profile.location
    website = resume.website if resume and resume.website else profile.website_url

    skills = list(Skill.objects.filter(active=True))
    emphasis = (version.emphasis or []) if version else []
    if emphasis:
        ordered = [s for name in emphasis for s in skills if s.name.strip().lower() == name.strip().lower()]
        rest = [s for s in skills if s not in ordered]
        skills = ordered + rest

    skills_list = [
        {"name": s.name, "category": s.category, "categoryLabel": CATEGORY_LABELS.get(s.category, s.category)}
        for s in skills
    ]

    experiences = list(Experience.objects.filter(active=True))
    educations = list(Education.objects.filter(active=True))
    certifications = list(Certification.objects.filter(active=True))
    projects = list(Project.objects.filter(published=True).exclude(status=Project.Status.PLANNED))
    projects.sort(key=lambda p: (p.status == Project.Status.IN_PROGRESS, p.order))

    def apply_filters(items, key, id_attr="id"):
        data, _title = _section_overrides(version, key) if version else ({}, None)
        include = data.get("include") or []
        if include:
            wanted = {getattr(i, id_attr) for i in items}
            items = [i for i in items if getattr(i, id_attr) in include and getattr(i, id_attr) in wanted]
        order = data.get("order") or []
        if order:
            by_id = {getattr(i, id_attr): i for i in items}
            items = [by_id[i] for i in order if i in by_id] + [i for i in items if getattr(i, id_attr) not in order]
        return items

    experiences = apply_filters(experiences, ResumeSection.Key.EXPERIENCE)
    educations = apply_filters(educations, ResumeSection.Key.EDUCATION)
    certifications = apply_filters(certifications, ResumeSection.Key.CERTIFICATIONS)
    projects = apply_filters(projects, ResumeSection.Key.PROJECTS, id_attr="pk")

    experience_payload = [
        {
            "title": e.title,
            "organization": e.organization,
            "employment_type": e.employment_type,
            "location": e.location,
            "start_date": e.start_date,
            "end_date": "Present" if e.current else e.end_date,
            "current": e.current,
            "bullets": [line.strip() for line in (e.description or "").splitlines() if line.strip()],
        }
        for e in experiences
    ]

    education_payload = [
        {
            "school": e.school,
            "degree": e.degree,
            "field": e.field,
            "start_date": e.start_date,
            "end_date": "Present" if e.current else e.end_date,
            "current": e.current,
            "detail": e.detail,
        }
        for e in educations
    ]

    certification_payload = [
        {"name": c.name, "issuer": c.issuer, "issue_date": c.issue_date, "url": c.credential_url}
        for c in certifications
    ]

    project_payload = [
        {
            "name": p.name,
            "tagline": p.tagline,
            "status": p.status,
            "role": p.role,
            "technologies": [pt.technology.name for pt in p.technologies.all()],
            "highlights": [
                {"text": f.text, "status": f.status}
                for f in p.features.all()
            ][:6],
        }
        for p in projects
    ]

    links_payload = [
        {"label": link.label, "url": link.url}
        for link in SocialLink.objects.filter(active=True)
    ]

    contact_lines = []
    if email:
        contact_lines.append({"kind": "email", "value": email})
    if phone:
        contact_lines.append({"kind": "phone", "value": phone})
    if location:
        contact_lines.append({"kind": "location", "value": location})
    if website:
        contact_lines.append({"kind": "website", "value": website})

    return {
        "profile": {
            "name": profile.name,
            "title": version.target_role if version and version.target_role else profile.title,
            "brand": profile.brand,
            "photo": profile.photo,
        },
        "resume": {
            "email": email,
            "phone": phone,
            "location": location,
            "website": website,
            "references_note": resume.references_note if resume else "",
        },
        "version": {"slug": version.slug, "title": version.title} if version else None,
        "versions": [{"slug": v.slug, "title": v.title, "target_role": v.target_role, "is_default": v.is_default} for v in versions],
        "contact_lines": contact_lines,
        "summary": summary,
        "skills": skills_list,
        "experience": experience_payload,
        "education": education_payload,
        "certifications": certification_payload,
        "projects": project_payload,
        "links": links_payload,
    }


def build_pdf(version_slug=None):
    """Return bytes of an ATS-friendly PDF for a resume version."""
    data = build_payload(version_slug)
    if data["profile"] is None:
        raise ValueError("No profile configured. Run: python manage.py seed_demo")

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.62 * inch,
        title=f"{data['profile']['name']} — Resume",
        author=data["profile"]["name"],
        subject="Professional resume",
    )

    ACCENT = colors.HexColor("#1b4d89")
    INK = colors.HexColor("#111111")
    GRAY = colors.HexColor("#444444")
    SOFT = colors.HexColor("#888888")

    name_style = ParagraphStyle("Name", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=INK, spaceAfter=2)
    title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=ACCENT, spaceAfter=4)
    contact_style = ParagraphStyle("Contact", fontName="Helvetica", fontSize=9.5, leading=13, textColor=GRAY, spaceAfter=0)
    section_style = ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=INK, spaceBefore=12, spaceAfter=3)
    section_meta = ParagraphStyle("SectionMeta", fontName="Helvetica", fontSize=9.5, leading=12, textColor=SOFT, spaceAfter=2)
    body_style = ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=14, textColor=INK, spaceAfter=4)
    bullet_style = ParagraphStyle("Bullet", fontName="Helvetica", fontSize=10, leading=13.5, textColor=INK, leftIndent=14, bulletIndent=4, spaceAfter=2)

    def rule():
        return Paragraph('<hr width="100%" color="#cccccc" size="0.5"/>', ParagraphStyle("rule", fontSize=0.5, spaceAfter=2))

    story = []
    story.append(Paragraph(data["profile"]["name"], name_style))
    story.append(Paragraph(data["profile"]["title"], title_style))
    story.append(Paragraph(' &nbsp;|&nbsp; '.join(c["value"] for c in data["contact_lines"]), contact_style))
    story.append(Spacer(1, 4))
    story.append(rule())

    # Summary
    if data.get("summary"):
        story.append(Paragraph("Professional Summary", section_style))
        story.append(Paragraph(data["summary"].strip(), body_style))

    # Skills
    skills = data["skills"]
    if skills:
        story.append(Paragraph("Technical Skills", section_style))
        grouped = {}
        for s in skills:
            grouped.setdefault(s["category"], []).append(s["name"])
        for cat in CATEGORY_ORDER:
            if cat not in grouped:
                continue
            label = CATEGORY_LABELS.get(cat, "")
            line = f"<b>{label}:</b> {', '.join(grouped[cat])}"
            story.append(Paragraph(line, body_style))

    # Experience
    experiences = data["experience"]
    if experiences:
        story.append(Paragraph("Professional Experience", section_style))
        for e in experiences:
            header = f"<b>{e['title']}</b> — {e['organization']}"
            if e.get("employment_type"):
                header += f" ({e['employment_type']})"
            story.append(Paragraph(header, body_style))
            dates = f"{e['start_date']} — {e['end_date']}"
            if e.get("location"):
                dates += f" &nbsp;·&nbsp; {e['location']}"
            story.append(Paragraph(dates, section_meta))
            for bullet in e["bullets"]:
                story.append(Paragraph(bullet, bullet_style, bulletText="•"))

    # Projects
    projects = data["projects"]
    if projects:
        story.append(Paragraph("Projects", section_style))
        for p in projects:
            header = f"<b>{p['name']}</b>"
            if p["tagline"]:
                header += f" — {p['tagline']}"
            if p["technologies"]:
                header += f" <font color=\"#666666\">({', '.join(p['technologies'])})</font>"
            story.append(Paragraph(header, body_style))
            if p["status"] != "implemented":
                story.append(Paragraph(f"Status: {'In development' if p['status'] == 'in_progress' else 'Planned'}", section_meta))
            for h in p["highlights"]:
                story.append(Paragraph(h["text"], bullet_style, bulletText="•"))

    # Education
    educations = data["education"]
    if educations:
        story.append(Paragraph("Education", section_style))
        for e in educations:
            line = f"<b>{e['degree']}</b>"
            if e["field"]:
                line += f" in {e['field']}"
            line += f" — {e['school']}"
            story.append(Paragraph(line, body_style))
            dates = f"{e['start_date']} — {e['end_date']}"
            if e.get("detail"):
                dates += f" &nbsp;·&nbsp; {e['detail']}"
            story.append(Paragraph(dates, section_meta))

    # Certifications
    certifications = data["certifications"]
    if certifications:
        story.append(Paragraph("Certifications", section_style))
        for c in certifications:
            line = f"<b>{c['name']}</b>"
            if c["issuer"]:
                line += f" — {c['issuer']}"
            if c["issue_date"]:
                line += f" ({c['issue_date']})"
            story.append(Paragraph(line, body_style))

    # Links
    links = data["links"]
    if links:
        story.append(Paragraph("Links", section_style))
        for link in links:
            story.append(Paragraph(f"{link['label']}: {link['url']}", body_style))

    refs = data["resume"].get("references_note")
    if refs:
        story.append(Spacer(1, 8))
        story.append(Paragraph(refs, section_meta))

    doc.build(story)
    return buf.getvalue()