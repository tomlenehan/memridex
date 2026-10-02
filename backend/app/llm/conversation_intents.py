import re

STORY_PAUSE_MESSAGE = (
    "We can pause here. Thank you for sharing this memory with me. "
    "It's ready to keep whenever you are."
)

STORY_EXPLICIT_PAUSE_MESSAGE = (
    "Of course. We can pause here. Thank you for sharing this memory with me. "
    "You can save it now, or come back and continue whenever you're ready."
)

STORY_RESUME_QUESTION = (
    "Let's keep exploring this memory. What else do you remember about this moment, "
    "or is there a small detail you haven't shared yet?"
)

_PAUSE_REQUEST_PATTERNS = (
    re.compile(r"\b(?:can|could|would)\s+we\s+(?:please\s+)?(?:pause|stop)\b", re.I),
    re.compile(
        r"\b(?:let['’]s|we should|i(?:'d like| want) to)\s+(?:pause|stop)\b", re.I
    ),
    re.compile(r"\b(?:pause|stop)\s+(?:for now|here|this conversation)\b", re.I),
    re.compile(r"\b(?:take|call)\s+a break\b", re.I),
    re.compile(r"\b(?:i['’]?m|i am)\s+done\s+for now\b", re.I),
)


def is_explicit_pause_request(content: str) -> bool:
    """Recognize clear requests to pause without treating every short reply as one."""
    return any(pattern.search(content) for pattern in _PAUSE_REQUEST_PATTERNS)
