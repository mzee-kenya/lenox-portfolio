def test_login_returns_token(client, seed_admin):
    response = client.post(
        "/api/auth/login/",
        {"username": "owner", "password": "Sup3rSecret!"},
        format="json",
    )
    assert response.status_code == 200
    assert "token" in response.json()


def test_login_rejects_bad_password(client, seed_admin):
    response = client.post(
        "/api/auth/login/",
        {"username": "owner", "password": "wrong-password"},
        format="json",
    )
    assert response.status_code == 400


def test_me_requires_token(client):
    assert client.get("/api/auth/me/").status_code in (401, 403)


def test_me_returns_user(staff_client, admin_user):
    response = staff_client.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.json()["username"] == admin_user.username