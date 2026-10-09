"""Seed the portfolio with verified, owner-maintainable starting content.

Everything here is truthful. Owner-supplied contact details (email, WhatsApp,
LinkedIn and the other social links) are seeded here; anything the owner later
edits in the admin dashboard wins over these defaults. The admin dashboard is
the single source of truth after seeding.
"""

import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from portfolio.models import Education, Experience, Profile, Skill, SkillCategory, SocialLink


class Command(BaseCommand):
    help = "Create the verified starting content for the portfolio."

    def add_arguments(self, parser):
        parser.add_argument("--admin-user", default="", help="Username for the owner admin account.")
        parser.add_argument("--admin-password", default="", help="Password for the owner admin account.")

    @transaction.atomic
    def handle(self, *args, **options):
        skills = {
            SkillCategory.FRONTEND: ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Responsive Design"],
            SkillCategory.BACKEND: ["Python", "Django", "Django REST Framework", "REST APIs"],
            SkillCategory.DATABASE: ["PostgreSQL", "SQLite", "SQL", "Django ORM"],
            SkillCategory.MOBILE: ["React Native", "Expo"],
            SkillCategory.TOOLS: ["Git", "GitHub", "VS Code", "npm"],
            SkillCategory.ENGINEERING: [
                "System Design",
                "API Design",
                "Authentication",
                "Role-Based Access",
                "Database Design",
                "Offline-First Architecture",
                "Debugging",
                "Software Architecture",
            ],
        }
        for category, names in skills.items():
            for order, name in enumerate(names):
                Skill.objects.get_or_create(name=name, defaults={"category": category, "order": order})

        profile, _ = Profile.objects.get_or_create(
            name="Lenox Okoth",
            defaults={
                "title": "Full-Stack Software Engineer",
                "brand": "Lentech",
                "role_tagline": "I build practical software systems that connect user experience, backend logic, and data.",
                "summary": (
                    "Full-stack software engineer and founder of Lentech. I build practical systems across the "
                    "frontend, backend, databases, and mobile — with React, Django, PostgreSQL, and React Native. "
                    "Currently completing a Software Engineering degree at Kirinyaga University while shipping real "
                    "software for real business problems."
                ),
                "about": (
                    "I am a Software Engineering student at Kirinyaga University and the founder of Lentech, a "
                    "software engineering studio focused on practical business tools. I design and build systems "
                    "end to end: responsive frontends, REST APIs, relational databases, authentication and "
                    "authorization, offline-first clients, and mobile applications.\n\n"
                    "Rather than practicing with throwaway tutorials, I learn by building and shipping real software — "
                    "retail management systems, collaboration platforms, and teaching laboratories for beginner "
                    "developers. I founded Lentech to give other learners the same hands-on starting point.\n\n"
                    "I care about clean architecture, secure defaults, accessible interfaces, and honest engineering. "
                    "If it solves a real problem, I want to build it."
                ),
                "location": "Kenya",
                "email": "lenox11458@gmail.co",
                "phone": "+254117274211",
                "github_url": "https://github.com/mzee-kenya",
                "linkedin_url": "https://www.linkedin.com/in/lenox-otieno-136765357",
                "meta_title": "Lenox Okoth | Full-Stack Software Engineer",
                "meta_description": (
                    "Full-Stack Software Engineer building practical web, backend, mobile, and business software "
                    "solutions with React, Django, Python, PostgreSQL, and modern technologies."
                ),
            },
        )

        # Owner-supplied contact details. Only applied when a field is still empty
        # or still the old placeholder, so anything edited in the dashboard wins.
        contact_values = {
            "email": "lenox11458@gmail.co",
            "phone": "+254117274211",
            "github_url": "https://github.com/mzee-kenya",
            "linkedin_url": "https://www.linkedin.com/in/lenox-otieno-136765357",
        }
        if not profile.phone:
            profile.phone = contact_values["phone"]
        if not profile.linkedin_url:
            profile.linkedin_url = contact_values["linkedin_url"]
        if not profile.github_url:
            profile.github_url = contact_values["github_url"]
        if (profile.email or "") in ("", "hello@lentech.dev"):
            profile.email = contact_values["email"]
        profile.save()

        social_links = [
            ("GitHub", "https://github.com/mzee-kenya", "github", 0),
            ("LinkedIn", "https://www.linkedin.com/in/lenox-otieno-136765357", "linkedin", 1),
            ("WhatsApp", "https://wa.me/254117274211", "whatsapp", 2),
            ("Facebook", "https://web.facebook.com/profile.php?id=61555239122493", "facebook", 3),
            ("Instagram", "https://www.instagram.com/mzee_kenya/", "instagram", 4),
            ("TikTok", "https://www.tiktok.com/@lentech_code?is_from_webapp=1&sender_device=pc", "tiktok", 5),
            ("YouTube", "https://youtube.com/@lentechcodestart?si=Ma37haliD6brvFKG", "youtube", 6),
        ]
        for label, url, icon, order in social_links:
            link, created = SocialLink.objects.get_or_create(
                label=label, defaults={"url": url, "icon": icon, "order": order}
            )
            if not created and (link.order != order or link.icon != icon):
                link.order = order
                link.icon = icon
                link.save(update_fields=["order", "icon"])

        Experience.objects.get_or_create(
            organization="Lentech",
            title="Founder & Full-Stack Developer",
            defaults={
                "location": "Kenya",
                "employment_type": "Full-time",
                "start_date": "2024",
                "end_date": "",
                "current": True,
                "order": 0,
                "description": "\n".join(
                    [
                        "Founded Lentech, a software engineering studio building practical tools for real businesses.",
                        "Designed and led development of Lentech POS, a full-stack point-of-sale and business management system with offline-first data and secure role-based access.",
                        "Designed REST APIs, relational data models, authentication, and cross-client synchronization services.",
                        "Building a developer collaboration platform (Lentech Nexus) connecting developers, clients, ideas, and projects.",
                        "Mentor beginner developers through project-based coding sessions covering web foundations, JavaScript, and full-stack concepts.",
                    ]
                ),
            },
        )

        Education.objects.get_or_create(
            school="Kirinyaga University",
            degree="BSc. Software Engineering",
            defaults={
                "field": "Software Engineering",
                "start_date": "2023",
                "end_date": "",
                "current": True,
                "detail": "Balancing a full-time course load with real-world, project-driven software development.",
                "order": 0,
            },
        )

        self._projects()
        self._resume()

        admin_user = options.get("admin_user") or ""
        admin_password = options.get("admin_password") or ""
        if admin_user and admin_password:
            user, created = User.objects.get_or_create(
                username=admin_user,
                defaults={"email": profile.email or "", "is_staff": True, "is_active": True},
            )
            if created:
                user.set_password(admin_password)
                user.is_staff = True
                user.is_active = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created admin user '{admin_user}'."))
            else:
                self.stdout.write(self.style.WARNING(f"Admin user '{admin_user}' already exists."))

        self.stdout.write(self.style.SUCCESS("Seed complete. Certifications are intentionally empty until the owner adds real ones."))

    def _projects(self):
        from projects.models import CaseStudy, Project, Technology

        # Lentech POS -----------------------------------------------------------
        from projects.models import ProjectFeature

        pos, _ = Project.objects.get_or_create(
            slug="lentech-pos",
            defaults={
                "name": "Lentech POS & Business Management System",
                "tagline": "Offline-first retail point of sale for real-world shops",
                "category": "Full-Stack Business System",
                "status": Project.Status.IN_PROGRESS,
                "description": (
                    "A business management and point-of-sale system designed for retail operations that cannot "
                    "depend on a stable internet connection. It manages sales, inventory, payments, credit "
                    "customers, user roles, and reports while keeping the shop running offline and syncing when "
                    "reconnected."
                ),
                "problem": (
                    "Small retail businesses depend on daily sales but often face unreliable internet and expensive "
                    "cloud-only tools. Losing a connection should not stop a shop from making a sale."
                ),
                "solution": (
                    "An offline-first POS where every sale is recorded locally and queued. When the network "
                    "returns, transactions synchronize automatically with the central database, and staff work "
                    "inside role-based permissions with full audit trails."
                ),
                "role": "Founder, product designer, and lead full-stack developer",
                "architecture": (
                    "The mobile app is built with React Native, Expo, and TypeScript and keeps a local SQLite "
                    "copy of catalog and sales data. Every mutation is queued and replayed against a REST API. "
                    "The backend (Express, PostgreSQL) validates each transaction, enforces permissions, and "
                    "keeps audit records. Payment adapters (cash, M-Pesa, card, bank) plug in behind a single "
                    "payment interface."
                ),
                "featured": True,
                "started_at": "2025",
                "github_url": "",  # owner adds the repository link
            },
        )
        technologies = {
            "React Native": "mobile",
            "Expo": "mobile",
            "TypeScript": "frontend",
            "SQLite": "database",
            "Express": "backend",
            "PostgreSQL": "database",
            "REST API": "backend",
        }
        self._set_techs(pos, technologies)
        if not pos.features.exists():
            self._features(
                pos,
                [
                    ("Offline-first transaction queue that survives connection loss", "implemented"),
                    ("Sales and checkout flows with receipt records", "implemented"),
                    ("Inventory management with stock tracking", "implemented"),
                    ("User roles and permission-aware UI", "implemented"),
                    ("Audit trail for sensitive operations", "implemented"),
                    ("Automated data synchronization on reconnect", "in_progress"),
                    ("Cash payment handling", "in_progress"),
                    ("Credit (pay-later) customer transactions", "in_progress"),
                    ("M-Pesa payment integration", "planned"),
                    ("Card and bank payment integration", "planned"),
                    ("Business reporting dashboards", "in_progress"),
                ],
            )
        CaseStudy.objects.get_or_create(
            project=pos,
            defaults={
                "architecture_text": pos.architecture,
                "challenges": [
                    "Keeping the system usable when the network is down without losing data or trust.",
                    "Reconciling locally-generated transactions with server-side validations after reconnecting.",
                    "Designing permissions so cashiers, managers, and owners each see exactly what they should.",
                ],
                "solutions": [
                    "An outbound queue persists every mutation locally and a background sync replays it in order once connectivity returns.",
                    "The API re-validates each queued transaction and imports failed ones for operator review instead of silently dropping them.",
                    "Role-based access enforced both in the API and in the UI so permissions hold server-side.",
                ],
                "results": [
                    "A shop can run a full sales day with no connection and lose nothing.",
                    "Every sale, refund, and adjustment is traceable to a user and timestamp.",
                ],
                "lessons": [
                    "Offline-first changes data modelling: every record needs stable local IDs and conflict rules.",
                    "Validation must live on the server, never only in the client.",
                ],
                "decisions": [
                    "SQLite locally, PostgreSQL centrally, with a replay queue as the sync contract.",
                    "Pluggable payment interface so M-Pesa, card, and bank can be added without rewriting checkout.",
                ],
            },
        )

        # Lentech Nexus ----------------------------------------------------------
        nex, _ = Project.objects.get_or_create(
            slug="lentech-nexus",
            defaults={
                "name": "Lentech Nexus",
                "tagline": "A collaboration platform for the Lentech ecosystem",
                "category": "Full-Stack Platform",
                "status": Project.Status.IN_PROGRESS,
                "description": (
                    "A platform that connects developers, clients, ideas, and software projects inside the Lentech "
                    "ecosystem — enabling project discovery, idea sharing, and structured developer collaboration."
                ),
                "problem": (
                    "Ideas, developers, and potential clients were scattered across chats and docs inside Lentech. "
                    "There was no single place to discover projects, share ideas, or onboard contributors."
                ),
                "solution": (
                    "Nexus brings ideas, developers, and projects into one modular system with authenticated "
                    "profiles, structured project records, and an API ready to integrate with the rest of the "
                    "Lentech stack."
                ),
                "role": "Founder, architect, and lead developer",
                "architecture": (
                    "A React + TypeScript frontend talks to a Django REST Framework API. Django apps are split by "
                    "domain (profiles, ideas, projects, collaboration) with serializers, services, and permissions "
                    "kept separate. PostgreSQL stores relational data; the modular app layout is designed so future "
                    "Lentech systems plug in without rewrites."
                ),
                "featured": True,
                "started_at": "2025",
                "github_url": "",
            },
        )
        self._set_techs(
            nex,
            {
                "React": "frontend",
                "TypeScript": "frontend",
                "Django": "backend",
                "Django REST Framework": "backend",
                "PostgreSQL": "database",
                "REST API": "backend",
            },
        )
        if not nex.features.exists():
            self._features(
                nex,
                [
                    ("Developer profiles", "implemented"),
                    ("Project discovery", "implemented"),
                    ("Idea sharing", "implemented"),
                    ("REST API design", "implemented"),
                    ("Modular Django architecture", "implemented"),
                    ("Developer collaboration workflows", "in_progress"),
                    ("Project management concepts", "in_progress"),
                    ("Integration with other Lentech systems", "planned"),
                ],
            )
        CaseStudy.objects.get_or_create(
            project=nex,
            defaults={
                "architecture_text": nex.architecture,
                "challenges": [
                    "Designing a system that could grow with many future Lentech products instead of a one-off app.",
                    "Separating structured project data from free-form idea sharing.",
                ],
                "solutions": [
                    "A modular Django project where each domain is an isolated app with public API contracts.",
                    "Distinct models and serializers for ideas versus projects, so each has the right lifecycle.",
                ],
                "results": [
                    "A single home for Lentech projects, ideas, and developer profiles.",
                    "An API-first boundary that future Lentech products can integrate against.",
                ],
                "lessons": [
                    "Modular boundaries pay off: one domain can change without breaking another.",
                    "API contracts, not shared databases, are the safest integration point between systems.",
                ],
                "decisions": [
                    "React + TypeScript frontend, Django REST Framework backend, PostgreSQL database.",
                ],
            },
        )

        # QuickNotes ------------------------------------------------------------
        qn, _ = Project.objects.get_or_create(
            slug="quicknotes",
            defaults={
                "name": "QuickNotes",
                "tagline": "Fast notes that live in your browser",
                "category": "Web Application",
                "status": Project.Status.IMPLEMENTED,
                "description": (
                    "A lightweight note-taking web app built with vanilla HTML, CSS, and JavaScript. Notes are "
                    "stored in the browser with LocalStorage, so there is no server, no account, and no setup."
                ),
                "problem": (
                    "Quick notes should not require an account, an app install, or a server round-trip just to save "
                    "a sentence."
                ),
                "solution": (
                    "A single-page app using the Document Object Model and LocalStorage: create, edit, and delete "
                    "notes instantly, with a clean responsive interface."
                ),
                "role": "Sole developer",
                "architecture": (
                    "Static HTML and CSS for structure and layout, plain JavaScript for DOM manipulation and state, "
                    "and LocalStorage for persistence. No frameworks, no build step, no backend."
                ),
                "featured": False,
                "started_at": "2024",
                "github_url": "",
            },
        )
        self._set_techs(
            qn,
            {
                "HTML5": "frontend",
                "CSS3": "frontend",
                "JavaScript": "frontend",
                "LocalStorage": "tools",
                "DOM": "frontend",
            },
        )
        if not qn.features.exists():
            self._features(
                qn,
                [
                    ("Create, edit, and delete notes", "implemented"),
                    ("Client-side persistence with LocalStorage", "implemented"),
                    ("Responsive interface", "implemented"),
                ],
            )
        CaseStudy.objects.get_or_create(
            project=qn,
            defaults={
                "architecture_text": qn.architecture,
                "challenges": ["Keeping state simple without a framework, while remaining readable and maintainable."],
                "solutions": [
                    "Small, single-responsibility functions for storage, rendering, and event handling instead of a tangled DOM script."
                ],
                "results": ["A working note app that loads instantly and works with JavaScript alone."],
                "lessons": [
                    "Understanding the platform (DOM, storage, events) before reaching for a framework builds better fundamentals."
                ],
                "decisions": ["No build tooling: a static app is the right complexity for the problem."],
            },
        )

        # Web Foundations Labs ---------------------------------------------------
        wf, _ = Project.objects.get_or_create(
            slug="web-foundations-labs",
            defaults={
                "name": "Web Foundations Teaching Labs",
                "tagline": "Project-based labs for mentoring beginner developers",
                "category": "Education / Teaching",
                "status": Project.Status.IMPLEMENTED,
                "description": (
                    "A growing set of project-based labs used to teach beginners the foundations of web development — "
                    "semantic HTML, CSS layout, and JavaScript — by building small working projects instead of "
                    "abstract exercises."
                ),
                "problem": (
                    "Beginners struggle when tutorials are passive. They need small, finished projects with instant "
                    "feedback to build momentum."
                ),
                "solution": (
                    "Structured labs where each session produces a visible, runnable result — a card component, a "
                    "responsive page, a form with validation — with clear success criteria."
                ),
                "role": "Instructor and lab author",
                "architecture": (
                    "Each lab is a self-contained static project with an explanation, a starter file, and a finished "
                    "example, designed to be reviewed in a live coding session."
                ),
                "featured": False,
                "started_at": "2024",
                "github_url": "",
            },
        )
        self._set_techs(
            wf,
            {
                "HTML5": "frontend",
                "CSS3": "frontend",
                "JavaScript": "frontend",
            },
        )
        if not wf.features.exists():
            self._features(
                wf,
                [
                    ("Project-based lesson structure", "implemented"),
                    ("Starter and solution files per lab", "implemented"),
                    ("Live coding session workflow", "implemented"),
                ],
            )
        CaseStudy.objects.get_or_create(
            project=wf,
            defaults={
                "architecture_text": wf.architecture,
                "challenges": ["Designing challenges with a difficulty curve that keeps beginners encouraged."],
                "solutions": [
                    "Every lab ends with something the learner can open and see working, then remix on their own."
                ],
                "results": ["A repeatable mentoring format that gets beginners building real projects quickly."],
                "lessons": [
                    "Teaching forces you to simplify: explaining fundamentals sharpens your own understanding."
                ],
                "decisions": ["Static, dependency-free labs so learners can run them anywhere."],
            },
        )

        self.stdout.write(self.style.SUCCESS("Projects seeded."))

    def _set_techs(self, project, technology_map):
        from projects.models import ProjectTechnology, Technology

        existing = {pt.technology.name for pt in project.technologies.all()}
        for order, (name, category) in enumerate(technology_map.items()):
            if name in existing:
                continue
            tech, _ = Technology.objects.get_or_create(name=name, defaults={"category": category})
            ProjectTechnology.objects.get_or_create(project=project, technology=tech, defaults={"order": order})

    def _features(self, project, items):
        from projects.models import ProjectFeature

        for order, (text, status) in enumerate(items):
            ProjectFeature.objects.get_or_create(
                project=project,
                text=text,
                defaults={"status": status, "order": order},
            )

    def _resume(self):
        from portfolio.models import Profile
        from resume.models import Resume, ResumeSection, ResumeVersion

        profile = Profile.objects.first()
        resume, created = Resume.objects.get_or_create(
            profile=profile,
            defaults={
                "summary": (
                    "Full-stack software engineer and founder of Lentech. Designs and builds practical systems "
                    "across the frontend, backend, databases, and mobile with React, TypeScript, Django, and "
                    "PostgreSQL. Currently completing a Software Engineering degree at Kirinyaga University while "
                    "shipping real software for retail and developer communities."
                ),
                "email": profile.email,
                "location": profile.location,
                "website": profile.website_url,
                "references_note": "References available on request.",
            },
        )
        if not created:
            changed = False
            if (resume.email or "") in ("", "hello@lentech.dev") and profile.email:
                resume.email = profile.email
                changed = True
            if not resume.phone and profile.phone:
                resume.phone = profile.phone
                changed = True
            if changed:
                resume.save()

        def version(slug, title, role, summary, emphasis, default=False, order=0):
            v, _ = ResumeVersion.objects.get_or_create(
                slug=slug,
                defaults={
                    "resume": resume,
                    "title": title,
                    "target_role": role,
                    "summary": summary,
                    "emphasis": emphasis,
                    "is_default": default,
                    "enabled": True,
                    "order": order,
                },
            )
            return v

        version(
            "fullstack",
            "Full-Stack Software Engineer",
            "Full-Stack Software Engineer",
            (
                "Full-stack software engineer and founder of Lentech. Builds practical systems across frontend, "
                "backend, databases, and mobile with React, TypeScript, Django, REST APIs, and PostgreSQL. Real "
                "products for retail and developer communities — including an offline-first POS and a collaboration "
                "platform. Completing a Software Engineering degree at Kirinyaga University."
            ),
            ["React", "Django", "PostgreSQL", "TypeScript", "REST APIs", "Django REST Framework", "React Native"],
            default=True,
            order=0,
        )
        version(
            "frontend",
            "Frontend Developer",
            "Frontend Developer",
            (
                "Frontend developer who builds clean, responsive interfaces with React, TypeScript, and modern CSS. "
                "Designs accessible UI states, smooth responsive layouts, and component systems used in real "
                "products, including a retail POS and a collaboration platform. Completed hands-on projects across "
                "static web apps and React Native mobile clients."
            ),
            ["React", "JavaScript", "TypeScript", "CSS3", "HTML5", "Responsive Design", "React Native"],
            order=1,
        )
        version(
            "backend",
            "Backend Developer",
            "Backend Developer",
            (
                "Backend developer focused on Python, Django, and REST API design. Builds validated, secure APIs "
                "with role-based access, Django ORM data modelling, and PostgreSQL. Ships audit trails, offline "
                "sync services, and multi-domain Django applications for real products."
            ),
            ["Python", "Django", "Django REST Framework", "REST APIs", "PostgreSQL", "SQLite", "Django ORM"],
            order=2,
        )

        # Ensure sections exist for the standard resume blocks (enabled by default).
        defaults = {
            ResumeSection.Key.SUMMARY: "Professional Summary",
            ResumeSection.Key.SKILLS: "Technical Skills",
            ResumeSection.Key.EXPERIENCE: "Professional Experience",
            ResumeSection.Key.EDUCATION: "Education",
            ResumeSection.Key.CERTIFICATIONS: "Certifications",
            ResumeSection.Key.PROJECTS: "Projects",
            ResumeSection.Key.LINKS: "Links",
        }
        for order, (key, title) in enumerate(defaults.items()):
            ResumeSection.objects.get_or_create(
                resume=resume,
                key=key,
                version=None,
                defaults={"title": title, "enabled": True, "order": order},
            )

        self.stdout.write(self.style.SUCCESS("Resume seeded with three versions (fullstack / frontend / backend)."))