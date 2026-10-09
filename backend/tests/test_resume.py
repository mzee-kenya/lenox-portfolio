def test_resume_versions_listed(client, seeded_site):
    response = client.get("/api/resume/versions/")
    assert response.status_code == 200
    slugs = [v["slug"] for v in response.json()]
    assert {"fullstack", "frontend", "backend"} <= set(slugs)


def test_resume_preview_payload(client, seeded_site):
    response = client.get("/api/resume/preview/fullstack/")
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["name"] == "Lenox Okoth"
    assert data["summary"]
    assert data["skills"]
    assert data["experience"]
    assert data["education"]
    assert data["projects"]
    assert data["contact_lines"]


def test_frontend_version_emphasizes_frontend_skills(client, seeded_site):
    data = client.get("/api/resume/preview/frontend/").json()
    first_names = [s["name"] for s in data["skills"][:5]]
    assert "React" in first_names


def test_resume_pdf_is_valid_pdf(client, seeded_site):
    response = client.get("/api/resume/pdf/backend/")
    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_resume_write_requires_auth(client, seeded_site):
    response = client.post(
        "/api/resume/versions/",
        {"slug": "hacker", "title": "H", "resume": 1},
        format="json",
    )
    assert response.status_code in (401, 403)


def test_resume_sections_create(staff_client, seeded_site):
    from resume.models import ResumeSection, ResumeVersion

    version = ResumeVersion.objects.get(slug="fullstack")
    response = staff_client.post(
        "/api/resume/sections/",
        {
            "key": "projects",
            "version": version.pk,
            "title": "Selected Projects",
            "enabled": True,
            "order": 1,
            "data": {"order": [1]},
        },
        format="json",
    )
    assert response.status_code in (200, 201)
    assert ResumeSection.objects.filter(version=version, key="projects").exists()