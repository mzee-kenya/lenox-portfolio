def valid_payload(**overrides):
    payload = {
        "name": "Jane Recruiter",
        "email": "jane@example.com",
        "subject": "Full-stack opportunity",
        "message": "We are hiring full-stack engineers and want to discuss your Lentech POS work and portfolio.",
        "consent": True,
    }
    payload.update(overrides)
    return payload


def test_valid_contact_submitted(client, seeded_site):
    response = client.post("/api/contact/", valid_payload(), format="json")
    assert response.status_code == 201
    assert response.json()["ok"] is True


def test_honeypot_blocks_bot(client, seeded_site):
    response = client.post(
        "/api/contact/",
        valid_payload(website="http://spammer.example"),
        format="json",
    )
    assert response.status_code == 400


def test_invalid_email_rejected(client, seeded_site):
    response = client.post(
        "/api/contact/",
        valid_payload(email="not-an-email"),
        format="json",
    )
    assert response.status_code == 400


def test_script_tags_stripped(client, seeded_site):
    response = client.post(
        "/api/contact/",
        valid_payload(name="<script>alert(1)</script>Robert"),
        format="json",
    )
    assert response.status_code in (201, 400)  # stripped or rejected, never stored raw
    if response.status_code == 201:
        from contact.models import ContactMessage

        msg = ContactMessage.objects.latest("id")
        assert "<script>" not in msg.name


def test_short_message_rejected(client, seeded_site):
    response = client.post(
        "/api/contact/",
        valid_payload(message="Too short."),
        format="json",
    )
    assert response.status_code == 400


def test_consent_required(client, seeded_site):
    payload = valid_payload()
    payload.pop("consent")
    response = client.post("/api/contact/", payload, format="json")
    assert response.status_code == 400


def test_messages_list_requires_staff(client, seeded_site):
    client.post("/api/contact/", valid_payload(), format="json")
    response = client.get("/api/contact/messages/")
    assert response.status_code in (401, 403)


def test_staff_can_mark_message_read(staff_client, seeded_site):
    from contact.models import ContactMessage

    staff_client.post("/api/contact/", valid_payload(), format="json")
    message = ContactMessage.objects.latest("id")
    response = staff_client.patch(
        f"/api/contact/messages/{message.pk}/",
        {"status": "read"},
        format="json",
    )
    assert response.status_code == 200
    message.refresh_from_db()
    assert message.status == "read"