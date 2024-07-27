from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from app.api.deps import get_current_active_superuser
from app.models import Message
from app.utils import generate_test_email, send_email

router = APIRouter()

class ContactEmailSchema(BaseModel):
    email: EmailStr
    message: str

@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")

@router.post("/send-contact-email/", status_code=201)
async def send_contact_email(
    email_data: ContactEmailSchema, background_tasks: BackgroundTasks
) -> Message:
    try:
        subject = "Contact Us Message"
        html_content = f"""
        <p>Email: {email_data.email}</p>
        <p>Message: {email_data.message}</p>
        """
        background_tasks.add_task(send_email, email_to=email_data.email, subject=subject, html_content=html_content)
        return Message(message="Contact email sent")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email. {e}")
