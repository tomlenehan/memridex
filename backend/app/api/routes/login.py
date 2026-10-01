import secrets
from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Message, NewPassword, Token, User, UserPublic
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter()


class GoogleCredential(BaseModel):
    credential: str


class GoogleConnectionStatus(BaseModel):
    connected: bool


def _google_claims(credential: str) -> dict[str, Any]:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Google sign-in could not be verified"
        )
    except GoogleAuthError:
        raise HTTPException(
            status_code=503, detail="Google sign-in is temporarily unavailable"
        )
    if (
        claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com")
        or not claims.get("sub")
        or claims.get("email_verified") is not True
        or not claims.get("email")
    ):
        raise HTTPException(
            status_code=401, detail="Google account could not be verified"
        )
    return claims


def _access_token(user: User) -> Token:
    return Token(
        access_token=security.create_access_token(
            user.id,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
    )


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return _access_token(user)


@router.post("/login/google", response_model=Token)
def login_google(body: GoogleCredential, session: SessionDep) -> Token:
    claims = _google_claims(body.credential)
    google_sub = claims["sub"]
    email = claims["email"].strip().lower()
    user = session.exec(select(User).where(User.google_sub == google_sub)).first()
    if user is None:
        user = session.exec(select(User).where(func.lower(User.email) == email)).first()
        if user:
            # Google is authoritative for Gmail and hosted Workspace addresses.
            if not (email.endswith("@gmail.com") or claims.get("hd")):
                raise HTTPException(
                    status_code=409,
                    detail="This email already has an account. Log in with your password, then connect Google in Your account.",
                )
            if user.google_sub and user.google_sub != google_sub:
                raise HTTPException(
                    status_code=409,
                    detail="This email is connected to another Google account",
                )
            if not user.is_active:
                raise HTTPException(status_code=403, detail="Inactive user")
            user.google_sub = google_sub
        else:
            if not settings.USERS_OPEN_REGISTRATION:
                raise HTTPException(
                    status_code=403, detail="New accounts are not available"
                )
            user = User(
                email=email,
                full_name=claims.get("name"),
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                google_sub=google_sub,
            )
        session.add(user)
        try:
            session.commit()
            session.refresh(user)
        except IntegrityError:
            session.rollback()
            user = session.exec(
                select(User).where(User.google_sub == google_sub)
            ).first()
            if user is None:
                raise HTTPException(
                    status_code=409,
                    detail="Account changed during Google sign-in. Please try again.",
                )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return _access_token(user)


@router.get("/login/google/status", response_model=GoogleConnectionStatus)
def google_connection_status(current_user: CurrentUser) -> GoogleConnectionStatus:
    return GoogleConnectionStatus(connected=bool(current_user.google_sub))


@router.post("/login/google/link", response_model=Message)
def link_google(
    body: GoogleCredential, session: SessionDep, current_user: CurrentUser
) -> Message:
    claims = _google_claims(body.credential)
    if claims["email"].strip().lower() != current_user.email.lower():
        raise HTTPException(
            status_code=400,
            detail="Choose the Google account with your MemriPlace email",
        )
    if current_user.google_sub and current_user.google_sub != claims["sub"]:
        raise HTTPException(
            status_code=409, detail="A different Google account is already connected"
        )
    owner = session.exec(select(User).where(User.google_sub == claims["sub"])).first()
    if owner and owner.id != current_user.id:
        raise HTTPException(
            status_code=409, detail="This Google account is already connected"
        )
    current_user.google_sub = claims["sub"]
    session.add(current_user)
    session.commit()
    return Message(message="Google account connected")


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )
