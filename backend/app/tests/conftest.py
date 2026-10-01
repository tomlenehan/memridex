import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlmodel import Session, SQLModel

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers


def clear_database(session: Session) -> None:
    """Remove dependent rows before their parents for repeatable test runs."""
    for table in reversed(SQLModel.metadata.sorted_tables):
        session.execute(delete(table))
    session.commit()


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    if os.environ.get("RUNNING_TESTS") != "true":
        raise RuntimeError(
            "Tests require RUNNING_TESTS=true to protect application data"
        )
    with Session(engine) as session:
        clear_database(session)
        init_db(session)
        yield session
        clear_database(session)


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
