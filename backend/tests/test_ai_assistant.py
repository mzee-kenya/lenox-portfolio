def test_matching_engine_returns_expected_results(seeded_site):
    from ai_assistant.engine import analyze

    job = (
        "We need a developer who knows React, Python, Django, PostgreSQL and SQL, "
        "and can build REST APIs for a mobile app built with React Native and Expo."
    )
    skills = ["React", "Python", "Django", "PostgreSQL", "SQL", "REST APIs", "React Native", "Expo"]
    projects = [{"technologies": ["React Native", "Expo", "SQLite"]}]

    result = analyze(job, skills, projects)

    assert result["score"] == 100
    assert {"react", "python", "django", "postgresql", "sql", "rest apis", "react native", "expo"} <= set(result["matched"])
    assert result["missing"] == []
    assert "estimate" in result["note"].lower()
    assert "score" in result  # documented as an estimate, never a guarantee


def test_matching_engine_reports_missing_skills(seeded_site):
    from ai_assistant.engine import analyze

    job = "We need React, Go, Kubernetes and Terraform experience."
    result = analyze(job, ["React", "Django"], [])
    assert "react" in result["matched"]
    assert set(result["missing"]) == {"go", "kubernetes", "terraform"}


def test_grounding_strips_invented_numbers():
    from ai_assistant.services import strip_ungrounded

    corpus = "Built a POS with React Native, Django and PostgreSQL. 3 years of studies."
    output = strip_ungrounded(
        "Built a POS with React Native, Django and PostgreSQL. "
        "Has 10 years of experience and 5 million users.",
        corpus,
    )
    assert "10 years" not in output
    assert "5 million" not in output
    assert "React Native" in output


def test_analyze_endpoint_persists_analysis(staff_client, seeded_site):
    response = staff_client.post(
        "/api/ai/analyze/",
        {
            "job_description": (
                "We are looking for an intern who knows Python, Django, and PostgreSQL "
                "and can work on REST APIs and React frontends for our product teams. "
                "This is a long enough description to pass validation rules."
            ),
            "resume_version": "fullstack",
            "session_id": "abc123",
        },
        format="json",
    )
    assert response.status_code == 200
    result = response.json()["result"]
    assert "score" in result and 0 <= result["score"] <= 100
    assert result["breakdown"] and result["note"]

    from ai_assistant.models import JobDescription, ResumeAnalysis

    assert JobDescription.objects.filter(session_id="abc123").exists()
    assert ResumeAnalysis.objects.filter(job_description__session_id="abc123").exists()


def test_analyze_endpoint_is_public(client, seeded_site):
    """Match My Resume works for visitors without an account (throttled, not blocked)."""
    response = client.post(
        "/api/ai/analyze/",
        {
            "job_description": (
                "We are seeking a full-stack developer with React, Python, Django and "
                "PostgreSQL experience to build REST APIs and internal tools for our "
                "engineering teams across multiple products and platforms."
            ),
            "resume_version": "fullstack",
        },
        format="json",
    )
    assert response.status_code == 200
    assert "score" in response.json()["result"]


def test_assist_requires_staff(client, db, seeded_site):
    from django.contrib.auth.models import User
    from projects.models import Project
    from rest_framework.test import APIClient

    anon = client.post(
        "/api/ai/assist/",
        {"action": "improve_summary", "summary": "Short bio for a full-stack engineer."},
        format="json",
    )
    assert anon.status_code in (401, 403)

    plain_user = User.objects.create_user(username="reader", password="Sup3rSecret!")
    plain = APIClient()
    plain.force_authenticate(user=plain_user)
    resp = plain.post(
        "/api/ai/assist/",
        {"action": "project_bullets", "project_id": Project.objects.get(slug="quicknotes").pk},
        format="json",
    )
    assert resp.status_code == 403


def test_assist_project_bullets_grounded(staff_client, seeded_site):
    from projects.models import Project

    project = Project.objects.get(slug="quicknotes")
    response = staff_client.post(
        "/api/ai/assist/",
        {"action": "project_bullets", "project_id": project.pk},
        format="json",
    )
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["bullets"]
    assert "QuickNotes" in str(result["item"]["name"]) or any(project.name.lower() in (b or "").lower() for b in result["bullets"])


def test_assist_unknown_action_rejected(staff_client):
    response = staff_client.post(
        "/api/ai/assist/",
        {"action": "make_up_dream_job"},
        format="json",
    )
    assert response.status_code == 400