def test_content_endpoint_returns_verified_profile(client, seeded_site):
    response = client.get("/api/content/")
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["name"] == "Lenox Okoth"
    assert data["profile"]["title"] == "Full-Stack Software Engineer"
    assert len(data["projects"]) >= 4
    assert len(data["skills"]) >= 6


def test_project_detail_includes_case_study(client, seeded_site):
    response = client.get("/api/projects/lentech-nexus/")
    assert response.status_code == 200
    data = response.json()
    assert data["case_study"] is not None
    assert isinstance(data["case_study"]["challenges"], list)
    assert len(data["features"]) > 0


def test_unpublished_projects_hidden_from_public(client, seeded_site):
    from projects.models import Project

    project = Project.objects.get(slug="quicknotes")
    project.published = False
    project.save()

    listing = client.get("/api/projects/").json()
    slugs = [p["slug"] for p in listing]
    assert "quicknotes" not in slugs

    detail = client.get("/api/projects/quicknotes/")
    assert detail.status_code == 404


def test_skills_serialized_by_category(client, seeded_site):
    data = client.get("/api/content/").json()
    by_cat = {block["category"]: block for block in data["skills"]}
    assert "frontend" in by_cat
    names = [s["name"] for s in by_cat["frontend"]["items"]]
    assert "React" in names and "TypeScript" in names


def test_anonymous_cannot_write_skills(client, seeded_site):
    response = client.post(
        "/api/skills/",
        {"name": "FakeSkill", "category": "frontend", "active": True},
        format="json",
    )
    assert response.status_code in (401, 403)


def test_staff_can_create_project(staff_client, seeded_site):
    response = staff_client.post(
        "/api/projects/",
        {
            "name": "Test Project",
            "slug": "test-project",
            "tagline": "T",
            "category": "Web",
            "status": "implemented",
            "description": "A verified test project.",
            "technologies": ["React", "Django"],
            "features": [{"text": "First feature", "status": "implemented"}],
        },
        format="json",
    )
    assert response.status_code in (201, 202), response.content
    data = response.json() if response.status_code < 300 else {}
    assert "name" in data and data["name"] == "Test Project"