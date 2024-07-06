from typing import Any, List

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
from app.api.deps import CurrentUser, SessionDep
from app.models import Contact, ContactCreate, ContactRead, Message

router = APIRouter()

@router.get("/", response_model=List[ContactRead])
def read_contacts(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve contacts.
    """
    statement = select(Contact).where(Contact.user_id == current_user.id).offset(skip).limit(limit)
    contacts = session.exec(statement).all()
    return contacts

@router.post("/", response_model=ContactRead)
def create_contact(*, session: SessionDep, current_user: CurrentUser, contact_in: ContactCreate) -> Any:
    """
    Create new contact.
    """
    contact = Contact(
        email=contact_in.email,
        user_id=current_user.id
    )
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.delete("/{id}", response_model=Message)
def delete_contact(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
    """
    Delete a contact.
    """
    contact = session.get(Contact, id)
    if not contact or contact.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    session.delete(contact)
    session.commit()
    return Message(message="Contact deleted successfully")
