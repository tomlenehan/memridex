"""Read saved memories and published stories aloud without accepting arbitrary text."""
import asyncio
import io
import logging
import wave
from collections import OrderedDict
from collections.abc import AsyncIterator

import httpx
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


async def _pcm_stream(text: str) -> AsyncIterator[bytes]:
    """Yield audio as it is generated so a listener does not wait for the full story."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Voice reading is not configured yet")
    try:
        chunks = split_for_speech(text, STREAM_CHUNK)
    except ValueError:
        raise HTTPException(422, "This story cannot be read aloud") from None
    if not chunks:
        raise HTTPException(422, "There is no story to read yet")

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            for chunk in chunks:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/audio/speech",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_NARRATION_MODEL,
                        "voice": settings.OPENAI_NARRATION_VOICE,
                        "input": chunk,
                        "instructions": "Read warmly, naturally, and clearly at an unhurried pace. Do not add any words.",
                        "response_format": "pcm",
                        "stream_format": "audio",
                    },
                ) as response:
                    response.raise_for_status()
                    async for audio in response.aiter_bytes():
                        if audio:
                            yield audio
    except httpx.HTTPError:
        logger.exception("Could not stream story narration")
        raise HTTPException(
            502, "Voice reading is unavailable. Please try again."
        ) from None


def _streaming_speech(text: str) -> StreamingResponse:
    return StreamingResponse(
        _pcm_stream(text),
        media_type=f"audio/L16;rate={PCM_SAMPLE_RATE};channels=1",
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
    frames: list[bytes] = []
    audio_params = None
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            for chunk in chunks:
                response = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_NARRATION_MODEL,
                        "voice": settings.OPENAI_NARRATION_VOICE,
                        "input": chunk,
                        "instructions": "Read warmly, naturally, and clearly at an unhurried pace. Do not add any words.",
                        "response_format": "wav",
                    },
                )
                response.raise_for_status()
                with wave.open(io.BytesIO(response.content), "rb") as part:
                    format_info = (
                        part.getnchannels(),
                        part.getsampwidth(),
                        part.getframerate(),
                        part.getcomptype(),
                    )
                    if audio_params is None:
                        audio_params = part.getparams()
                        audio_format = format_info
                    elif format_info != audio_format:
                        raise ValueError("Audio format changed between story segments")
                    frames.append(part.readframes(part.getnframes()))
    except (httpx.HTTPError, wave.Error, ValueError):
        logger.exception("Could not generate story narration")
        raise HTTPException(
            502, "Voice reading is unavailable. Please try again."
        ) from None
    with wave.open(output, "wb") as combined:
        combined.setparams(
            (
                audio_params.nchannels,
                audio_params.sampwidth,
                audio_params.framerate,
                0,
                audio_params.comptype,
                audio_params.compname,
            )
        )
        for segment in frames:
            combined.writeframes(segment)
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
    story_id: int, session: SessionDep, current_user: CurrentUser, stream: bool = False
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
    return _streaming_speech(text) if stream else await _speech(text)


@router.post("/constellations/{constellation_id}")
async def narrate_constellation(
    constellation_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    stream: bool = False,
) -> Response:
    constellation = _owned(session, current_user.id, constellation_id)
    text = f"{constellation.title}. {constellation.overview}"
    return _streaming_speech(text) if stream else await _speech(text)


@router.post("/public/{publication_id}")
async def narrate_public_constellation(
    publication_id: int, session: SessionDep, stream: bool = False
) -> Response:
    _enabled()
    publication = session.get(PublishedConstellation, publication_id)
    if not publication:
        raise HTTPException(404, "Constellation not found")
    snapshot = _published_detail(session, publication)
    text = f"{snapshot.title}. {snapshot.overview}"
    return (
        _streaming_speech(text)
        if stream
        else await _public_speech((publication.id, publication.revision, None), text)
    )


@router.post("/public/{publication_id}/memories/{star_index}")
async def narrate_public_memory(
    publication_id: int, star_index: int, session: SessionDep, stream: bool = False
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
        _streaming_speech(text)
        if stream
        else await _public_speech(
            (publication.id, publication.revision, star_index), text
        )
    )
