"""Read saved memories and published stories aloud without accepting arbitrary text."""
import asyncio
import base64
import binascii
import io
import json
import logging
import re
import wave
from collections import OrderedDict
from collections.abc import AsyncIterator, Sequence
from urllib.parse import quote

import websockets
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.constellations import _owned
from app.api.routes.public_sky import _enabled, _published_detail
from app.core.config import settings
from app.models import PublishedConstellation, StorySummary

router = APIRouter()
logger = logging.getLogger(__name__)
MAX_CHUNK = 3900
STREAM_CHUNK = 900
PCM_SAMPLE_RATE = 24000
PUBLIC_CACHE_LIMIT = 24 * 1024 * 1024
_public_cache: OrderedDict[tuple[int, int, int | None], bytes] = OrderedDict()
_public_cache_lock = asyncio.Lock()
REALTIME_TIMEOUT_SECONDS = 120


class NarrationGenerationError(Exception):
    """Raised when the Realtime API cannot generate narration audio."""


async def _receive_realtime_event(
    connection: websockets.WebSocketClientProtocol,
) -> dict[str, object]:
    message = await asyncio.wait_for(
        connection.recv(), timeout=REALTIME_TIMEOUT_SECONDS
    )
    if isinstance(message, bytes):
        message = message.decode("utf-8")
    event = json.loads(message)
    if not isinstance(event, dict):
        raise NarrationGenerationError("The voice service returned an invalid event")
    if event.get("type") == "error":
        raise NarrationGenerationError("The voice service rejected the narration request")
    return event


async def _realtime_pcm_chunks(
    chunks: Sequence[str],
) -> AsyncIterator[tuple[int, bytes | None]]:
    """Generate narration through one Realtime session, yielding PCM per text chunk."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Voice reading is not configured yet")

    model = quote(settings.OPENAI_NARRATION_REALTIME_MODEL, safe="")
    url = f"wss://api.openai.com/v1/realtime?model={model}"
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
    try:
        async with websockets.connect(
            url,
            extra_headers=headers,
            open_timeout=20,
            close_timeout=5,
            max_size=None,
        ) as connection:
            event = await _receive_realtime_event(connection)
            if event.get("type") != "session.created":
                raise NarrationGenerationError("The voice session did not initialize")

            await connection.send(
                json.dumps(
                    {
                        "type": "session.update",
                        "session": {
                            "type": "realtime",
                            "model": settings.OPENAI_NARRATION_REALTIME_MODEL,
                            "output_modalities": ["audio"],
                            "audio": {
                                "output": {
                                    "format": {
                                        "type": "audio/pcm",
                                        "rate": PCM_SAMPLE_RATE,
                                    },
                                    "voice": settings.OPENAI_NARRATION_VOICE,
                                }
                            },
                            "instructions": (
                                "Read the supplied text exactly as written, with a warm, natural, "
                                "unhurried delivery. Do not add, omit, or rephrase any words."
                            ),
                        }
                    }
                )
            )
            event = await _receive_realtime_event(connection)
            if event.get("type") != "session.updated":
                raise NarrationGenerationError("The voice session could not be configured")

            for chunk_index, chunk in enumerate(chunks):
                await connection.send(
                    json.dumps(
                        {
                            "type": "response.create",
                            "response": {
                                "conversation": "none",
                                "output_modalities": ["audio"],
                                "input": [
                                    {
                                        "type": "message",
                                        "role": "user",
                                        "content": [
                                            {"type": "input_text", "text": chunk}
                                        ],
                                    }
                                ],
                            },
                        }
                    )
                )
                while True:
                    event = await _receive_realtime_event(connection)
                    event_type = event.get("type")
                    if event_type == "response.output_audio.delta":
                        encoded_audio = event.get("delta")
                        if isinstance(encoded_audio, str):
                            yield chunk_index, base64.b64decode(encoded_audio, validate=True)
                    elif event_type == "response.done":
                        response = event.get("response")
                        status = response.get("status") if isinstance(response, dict) else None
                        if status != "completed":
                            raise NarrationGenerationError(
                                "The voice service did not complete narration"
                            )
                        yield chunk_index, None
                        break
    except HTTPException:
        raise
    except NarrationGenerationError:
        raise
    except (
        websockets.exceptions.WebSocketException,
        asyncio.TimeoutError,
        OSError,
        UnicodeDecodeError,
        json.JSONDecodeError,
        binascii.Error,
    ) as error:
        logger.warning("Realtime narration request failed: %s", type(error).__name__)
        raise NarrationGenerationError(
            "Voice reading is unavailable. Please try again."
        ) from None


def _sentences(text: str) -> list[str]:
    """Split readable prose at sentence boundaries while retaining punctuation."""
    parts = re.findall(r"[^.!?]+[.!?]+(?:[\"'”’)]*)|[^.!?]+$", text)
    return [part.strip() for part in parts if part.strip()]


def _packet(kind: int, payload: bytes = b"") -> bytes:
    """Frame a narration-stream packet: type byte, 32-bit big-endian size, payload."""
    return bytes((kind,)) + len(payload).to_bytes(4, "big") + payload


def _split_stream_chunks(text: str, max_chunk: int = STREAM_CHUNK) -> list[str]:
    chunks: list[str] = []
    current = ""
    for sentence in _sentences(text):
        parts = split_for_speech(sentence, max_chunk) if len(sentence) > max_chunk else [sentence]
        for part in parts:
            candidate = f"{current} {part}" if current else part
            if current and len(candidate) > max_chunk:
                chunks.append(current)
                current = part
            else:
                current = candidate
    if current:
        chunks.append(current)
    return chunks


def split_for_speech(text: str, max_chunk: int = MAX_CHUNK) -> list[str]:
    words = text.split()
    chunks: list[str] = []
    current = ""
    for word in words:
        if len(word) > max_chunk:
            raise ValueError("A word is too long to read aloud")
        if len(current) + len(word) + bool(current) > max_chunk:
            chunks.append(current)
            current = word
        else:
            current = f"{current} {word}" if current else word
    if current:
        chunks.append(current)
    return chunks


async def _pcm_stream(text: str, with_sentences: bool = False) -> AsyncIterator[bytes]:
    """Stream PCM, optionally framing chunks with sentence metadata for highlighting."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Voice reading is not configured yet")
    try:
        chunks = (
            _split_stream_chunks(text)
            if with_sentences
            else split_for_speech(text, STREAM_CHUNK)
        )
    except ValueError:
        raise HTTPException(422, "This story cannot be read aloud") from None
    if not chunks:
        raise HTTPException(422, "There is no story to read yet")

    try:
        audio_stream = _realtime_pcm_chunks(chunks).__aiter__()
        try:
            for chunk_index, chunk in enumerate(chunks):
                if with_sentences:
                    sentences = _sentences(chunk)
                    metadata = json.dumps(
                        {"sentences": sentences}, ensure_ascii=False
                    ).encode("utf-8")
                    yield _packet(2, metadata)
                while True:
                    returned_index, audio = await anext(audio_stream)
                    if returned_index != chunk_index:
                        raise NarrationGenerationError(
                            "Voice audio arrived out of sequence"
                        )
                    if audio is None:
                        break
                    yield _packet(1, audio) if with_sentences else audio
                if with_sentences:
                    yield _packet(3)
            if with_sentences:
                yield _packet(0)
        finally:
            await audio_stream.aclose()
    except (NarrationGenerationError, StopAsyncIteration):
        logger.exception("Could not stream story narration")
        raise HTTPException(
            502, "Voice reading is unavailable. Please try again."
        ) from None


def _streaming_speech(text: str, with_sentences: bool = False) -> StreamingResponse:
    return StreamingResponse(
        _pcm_stream(text, with_sentences),
        media_type=(
            "application/vnd.memriplace.narration-stream"
            if with_sentences
            else f"audio/L16;rate={PCM_SAMPLE_RATE};channels=1"
        ),
        headers={"Cache-Control": "private, no-store"},
    )


async def _speech(text: str) -> Response:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Voice reading is not configured yet")
    try:
        chunks = split_for_speech(text)
    except ValueError:
        raise HTTPException(422, "This story cannot be read aloud") from None
    if not chunks:
        raise HTTPException(422, "There is no story to read yet")

    output = io.BytesIO()
    try:
        with wave.open(output, "wb") as combined:
            combined.setnchannels(1)
            combined.setsampwidth(2)
            combined.setframerate(PCM_SAMPLE_RATE)
            async for _, audio in _realtime_pcm_chunks(chunks):
                if audio:
                    combined.writeframes(audio)
    except (NarrationGenerationError, wave.Error, ValueError):
        logger.exception("Could not generate story narration")
        raise HTTPException(
            502, "Voice reading is unavailable. Please try again."
        ) from None
    return Response(
        output.getvalue(),
        media_type="audio/wav",
        headers={"Cache-Control": "private, no-store"},
    )


async def _public_speech(key: tuple[int, int, int | None], text: str) -> Response:
    async with _public_cache_lock:
        saved = _public_cache.get(key)
        if saved is not None:
            _public_cache.move_to_end(key)
            return Response(
                saved,
                media_type="audio/wav",
                headers={"Cache-Control": "public, max-age=300"},
            )
        result = await _speech(text)
        if len(result.body) <= PUBLIC_CACHE_LIMIT:
            while (
                _public_cache
                and sum(map(len, _public_cache.values())) + len(result.body)
                > PUBLIC_CACHE_LIMIT
            ):
                _public_cache.popitem(last=False)
            _public_cache[key] = result.body
        return Response(
            result.body,
            media_type="audio/wav",
            headers={"Cache-Control": "public, max-age=300"},
        )


@router.post("/memories/{story_id}")
async def narrate_memory(
    story_id: int, session: SessionDep, current_user: CurrentUser, stream: bool = False,
    sentences: bool = False,
) -> Response:
    story = session.exec(
        select(StorySummary).where(
            StorySummary.id == story_id,
            StorySummary.user_id == current_user.id,
        )
    ).first()
    if not story:
        raise HTTPException(404, "Memory not found")
    text = f"{story.title or 'A remembered moment'}. {story.summary_text}"
    return _streaming_speech(text, sentences) if stream else await _speech(text)


@router.post("/constellations/{constellation_id}")
async def narrate_constellation(
    constellation_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    stream: bool = False,
    sentences: bool = False,
) -> Response:
    constellation = _owned(session, current_user.id, constellation_id)
    text = f"{constellation.title}. {constellation.overview}"
    return _streaming_speech(text, sentences) if stream else await _speech(text)


@router.post("/public/{publication_id}")
async def narrate_public_constellation(
    publication_id: int, session: SessionDep, stream: bool = False, sentences: bool = False
) -> Response:
    _enabled()
    publication = session.get(PublishedConstellation, publication_id)
    if not publication:
        raise HTTPException(404, "Constellation not found")
    snapshot = _published_detail(session, publication)
    text = f"{snapshot.title}. {snapshot.overview}"
    return (
        _streaming_speech(text, sentences)
        if stream
        else await _public_speech((publication.id, publication.revision, None), text)
    )


@router.post("/public/{publication_id}/memories/{star_index}")
async def narrate_public_memory(
    publication_id: int, star_index: int, session: SessionDep, stream: bool = False,
    sentences: bool = False,
) -> Response:
    _enabled()
    publication = session.get(PublishedConstellation, publication_id)
    if not publication:
        raise HTTPException(404, "Constellation not found")
    snapshot = _published_detail(session, publication)
    star = next((item for item in snapshot.stars if item.index == star_index), None)
    if not star or not star.story_text:
        raise HTTPException(404, "This memory was not shared")
    text = f"{star.title}. {star.story_text}"
    return (
        _streaming_speech(text, sentences)
        if stream
        else await _public_speech(
            (publication.id, publication.revision, star_index), text
        )
    )
