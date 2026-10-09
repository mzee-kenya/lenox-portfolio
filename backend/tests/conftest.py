import pytest
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="owner", email="owner@example.com", password="Sup3rSecret!", is_staff=True)


@pytest.fixture
def staff_client(db, admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.fixture
def seeded_site(db):
    from django.core.management import call_command

    call_command("seed_demo")
    return True


@pytest.fixture
def seed_admin(db):
    return User.objects.create_user(username="owner", email="owner@example.com", password="Sup3rSecret!", is_staff=True)