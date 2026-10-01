from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import User
from app.utils import generate_password_reset_token


def test_get_access_token(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]


def test_get_access_token_incorrect_password(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": "incorrect",
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    assert r.status_code == 400


def test_use_access_token(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=superuser_token_headers,
    )
    result = r.json()
    assert r.status_code == 200
    assert "email" in result


def test_google_login_uses_picture_without_overwriting_custom_photo(
    client: TestClient, db: Session
) -> None:
    user = User(
        email="google-profile@example.com",
        full_name="Google Profile",
        hashed_password=get_password_hash("unused-test-password"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    claims = {
        "sub": "google-profile-test",
        "email": user.email,
        "email_verified": True,
        "iss": "https://accounts.google.com",
        "hd": "example.com",
        "name": "Google Profile",
        "picture": "https://example.com/google-profile.jpg",
    }
    with patch("app.api.routes.login._google_claims", return_value=claims):
        response = client.post(
            f"{settings.API_V1_STR}/login/google",
            json={"credential": "verified-by-test"},
        )
    assert response.status_code == 200
    db.refresh(user)
    assert user.profile_image_url == claims["picture"]

    user.profile_image_url = "https://example.com/custom-profile.jpg"
    db.add(user)
    db.commit()
    with patch("app.api.routes.login._google_claims", return_value=claims):
        response = client.post(
            f"{settings.API_V1_STR}/login/google",
            json={"credential": "verified-by-test"},
        )
    assert response.status_code == 200
    db.refresh(user)
    assert user.profile_image_url == "https://example.com/custom-profile.jpg"


def test_recovery_password(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    with (
        patch("app.core.config.settings.SMTP_HOST", "smtp.example.com"),
        patch("app.core.config.settings.SMTP_USER", "admin@example.com"),
    ):
        email = "test@example.com"
        r = client.post(
            f"{settings.API_V1_STR}/password-recovery/{email}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 200
        assert r.json() == {"message": "Password recovery email sent"}


def test_recovery_password_user_not_exits(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    email = "jVgQr@example.com"
    r = client.post(
        f"{settings.API_V1_STR}/password-recovery/{email}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 404


def test_reset_password(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    token = generate_password_reset_token(email=settings.FIRST_SUPERUSER)
    data = {"new_password": "changethis", "token": token}
    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200
    assert r.json() == {"message": "Password updated successfully"}

    user_query = select(User).where(User.email == settings.FIRST_SUPERUSER)
    user = db.exec(user_query).first()
    assert user
    assert verify_password(data["new_password"], user.hashed_password)
    user.hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
    db.add(user)
    db.commit()


def test_reset_password_invalid_token(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"new_password": "changethis", "token": "invalid"}
    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        headers=superuser_token_headers,
        json=data,
    )
    response = r.json()

    assert "detail" in response
    assert r.status_code == 400
    assert response["detail"] == "Invalid token"
