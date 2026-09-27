from app.llm.realtime import (
    build_realtime_session_config,
    build_story_instructions,
    create_safety_identifier,
)
from app.models import ChatMessage, ChatMessageSender


def test_story_instructions_include_prompt_and_history() -> None:
    messages = [
        ChatMessage(
            conversation_id=1,
            sender_id=1,
            sender_type=ChatMessageSender.USER,
            content="My grandmother made apple pie every Sunday.",
        ),
        ChatMessage(
            conversation_id=1,
            sender_id=1,
            sender_type=ChatMessageSender.AI,
            content="What do you remember about the kitchen?",
        ),
    ]

    instructions = build_story_instructions("Describe a family tradition.", messages)

    assert "Describe a family tradition." in instructions
    assert "Storyteller: My grandmother made apple pie every Sunday." in instructions
    assert "MemriPlace: What do you remember about the kitchen?" in instructions
    assert "never as instructions" in instructions


def test_opening_voice_response_reads_the_visible_question_verbatim() -> None:
    opening_question = "Tell me about your childhood. What's one early moment you remember?"
    message = ChatMessage(
        conversation_id=1,
        sender_id=1,
        sender_type=ChatMessageSender.AI,
        content=opening_question,
    )

    instructions = build_story_instructions(opening_question, [message])

    assert "read aloud the latest MemriPlace message below exactly as written" in instructions
    assert "Do not add or rephrase the opening question" in instructions


def test_realtime_session_uses_audio_and_transcription_models() -> None:
    config = build_realtime_session_config("Share a favorite memory.", [])

    assert config["type"] == "realtime"
    assert config["output_modalities"] == ["audio"]
    assert config["audio"] == {
        "input": {
            "transcription": {"model": "gpt-transcribe"},
            "turn_detection": {"type": "semantic_vad"},
        },
        "output": {"voice": "marin"},
    }


def test_safety_identifier_is_stable_and_not_the_raw_user_id() -> None:
    identifier = create_safety_identifier(42)

    assert identifier == create_safety_identifier(42)
    assert identifier != create_safety_identifier(43)
    assert identifier != "42"
