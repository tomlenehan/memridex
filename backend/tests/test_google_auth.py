import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine, select

from app.api.deps import get_db
from app.api.routes import login
from app.core.config import settings
from app.core.security import get_password_hash
from app.main import app
from app.models import User


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    User.__table__.create(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


def claims(email="person@gmail.com", sub="google-person", **extra):
    return {
        "iss": "https://accounts.google.com",
        "sub": sub,
        "email": email,
        "email_verified": True,
        "name": "A Person",
        **extra,
    }


def test_google_token_validation(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "client-id")
    monkeypatch.setattr(
        login.id_token,
        "verify_oauth2_token",
        lambda token, request, audience: claims() if audience == "client-id" else None,
    )
    assert login._google_claims("credential")["sub"] == "google-person"

    monkeypatch.setattr(login.id_token, "verify_oauth2_token", lambda *args: claims(email_verified=False))
    with pytest.raises(HTTPException) as error:
        login._google_claims("credential")
    assert error.value.status_code == 401

    monkeypatch.setattr(login.id_token, "verify_oauth2_token", lambda *args: claims(iss="invalid"))
    with pytest.raises(HTTPException) as error:
        login._google_claims("credential")
    assert error.value.status_code == 401


def test_first_and_returning_google_login(monkeypatch, session):
    monkeypatch.setattr(settings, "USERS_OPEN_REGISTRATION", True)
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims())
    first = login.login_google(login.GoogleCredential(credential="token"), session)
    second = login.login_google(login.GoogleCredential(credential="token"), session)
    users = session.exec(select(User)).all()
    assert first.access_token and second.access_token
    assert len(users) == 1
    assert users[0].google_sub == "google-person"
    assert users[0].full_name == "A Person"


def test_google_login_http_route(monkeypatch, session):
    monkeypatch.setattr(settings, "USERS_OPEN_REGISTRATION", True)
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims())

    def test_db():
        yield session

    app.dependency_overrides[get_db] = test_db
    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/login/google", json={"credential": "token"})
            assert response.status_code == 200
            access_token = response.json()["access_token"]
            status = client.get(
                "/api/v1/login/google/status",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            assert status.status_code == 200
            assert status.json() == {"connected": True}
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_existing_gmail_account_is_linked(monkeypatch, session):
    user = User(email="Person@Gmail.com", hashed_password=get_password_hash("secret"))
    session.add(user)
    session.commit()
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims())
    login.login_google(login.GoogleCredential(credential="token"), session)
    assert user.google_sub == "google-person"
    assert session.exec(select(User)).all() == [user]


def test_external_email_requires_explicit_link(monkeypatch, session):
    user = User(email="person@example.com", hashed_password=get_password_hash("secret"))
    session.add(user)
    session.commit()
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims(email="person@example.com"))
    with pytest.raises(HTTPException) as error:
        login.login_google(login.GoogleCredential(credential="token"), session)
    assert error.value.status_code == 409
    assert user.google_sub is None

    result = login.link_google(login.GoogleCredential(credential="token"), session, user)
    assert result.message == "Google account connected"
    assert login.google_connection_status(user).connected
    assert login.login_google(login.GoogleCredential(credential="token"), session).access_token


def test_google_link_rejects_other_email(monkeypatch, session):
    user = User(email="person@example.com", hashed_password=get_password_hash("secret"))
    session.add(user)
    session.commit()
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims())
    with pytest.raises(HTTPException) as error:
        login.link_google(login.GoogleCredential(credential="token"), session, user)
    assert error.value.status_code == 400
    assert user.google_sub is None


def test_closed_registration_and_inactive_user(monkeypatch, session):
    monkeypatch.setattr(settings, "USERS_OPEN_REGISTRATION", False)
    monkeypatch.setattr(login, "_google_claims", lambda credential: claims())
    with pytest.raises(HTTPException) as error:
        login.login_google(login.GoogleCredential(credential="token"), session)
    assert error.value.status_code == 403

    user = User(email="person@gmail.com", hashed_password=get_password_hash("secret"), is_active=False)
    session.add(user)
    session.commit()
    with pytest.raises(HTTPException) as error:
        login.login_google(login.GoogleCredential(credential="token"), session)
    assert error.value.status_code == 403
    assert user.google_sub is None
