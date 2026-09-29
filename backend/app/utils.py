import logging
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

import boto3  # type: ignore
import emails  # type: ignore
from botocore.exceptions import (  # type: ignore
    NoCredentialsError,
    PartialCredentialsError,
)
from fastapi import UploadFile
from jinja2 import Template
from jose import JWTError, jwt

from app.core.config import settings

LOCAL_UPLOADS_DIRECTORY = Path(__file__).resolve().parent.parent / "uploads"


def get_local_uploads_directory() -> Path:
    """Return the upload directory used locally and by the Render persistent disk."""
    return LOCAL_UPLOADS_DIRECTORY


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logging.info(f"send email result: {response}")


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.server_host}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str,
    username: str,
    password: str,  # noqa: ARG001
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            # "password": password,
            "email": email_to,
            "link": settings.server_host,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return str(decoded_token["sub"])
    except JWTError:
        return None


def _upload_image_to_s3(image: UploadFile, *, private: bool) -> str:
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )
        bucket_name = os.getenv("AWS_UPLOAD_BUCKET_NAME")
        if not bucket_name:
            raise ValueError("Bucket name not set in environment variables")

        # Generate a unique image name using uuid
        unique_image_name = f"{uuid4()}_{image.filename}"

        extra_args: dict[str, str] = {}
        if image.content_type:
            extra_args["ContentType"] = image.content_type
        if not private:
            extra_args["ACL"] = "public-read"
        s3_client.upload_fileobj(
            image.file,
            bucket_name,
            unique_image_name,
            ExtraArgs=extra_args,
        )

        if private:
            return f"s3-private://{unique_image_name}"
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_image_name}"
        return image_url
    except NoCredentialsError:
        raise Exception("AWS credentials not available")
    except PartialCredentialsError:
        raise Exception("Incomplete AWS credentials provided")
    except s3_client.exceptions.ClientError as e:
        raise Exception(f"Failed to upload image to S3: {e}")


def upload_image_to_s3(image: UploadFile) -> str:
    return _upload_image_to_s3(image, private=False)


def upload_private_story_image(image: UploadFile) -> str:
    """Store a story image on the local filesystem or the mounted Render disk."""
    filename = image.filename or "image"
    suffix = Path(filename).suffix.lower()
    if suffix not in {".gif", ".jpeg", ".jpg", ".png", ".webp"}:
        suffix = ".png" if image.content_type == "image/png" else ".bin"

    try:
        uploads_directory = get_local_uploads_directory()
        uploads_directory.mkdir(parents=True, exist_ok=True)
        stored_filename = f"{uuid4()}{suffix}"
        with (uploads_directory / stored_filename).open("wb") as destination:
            shutil.copyfileobj(image.file, destination)
        return f"disk-private://{stored_filename}"
    except OSError as error:
        raise RuntimeError("Could not store the story image") from error


def get_private_image_url(
    image_url: str | None, *, user_id: int | None = None
) -> str | None:
    if not image_url:
        return image_url

    if image_url.startswith("disk-private://"):
        filename = image_url.removeprefix("disk-private://")
        if not user_id or Path(filename).name != filename:
            return None
        token = jwt.encode(
            {
                "exp": datetime.utcnow() + timedelta(hours=1),
                "file": filename,
                "scope": "story-image",
                "sub": str(user_id),
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        return f"{settings.API_V1_STR}/summaries/uploads/{token}"

    if not image_url.startswith("s3-private://"):
        return image_url

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
    )
    try:
        return str(
            s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": os.getenv("AWS_UPLOAD_BUCKET_NAME"),
                    "Key": image_url.removeprefix("s3-private://"),
                },
                ExpiresIn=3600,
            )
        )
    except Exception:
        logging.exception("Could not create a temporary URL for a private story image")
        return None
