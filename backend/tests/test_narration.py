import asyncio
import io
import struct
import wave
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.responses import Response

from app.api.routes import narration


def make_wav(frames: bytes, streaming_header: bool = False) -> bytes:
    output = io.BytesIO()
    with wave.open(output, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(frames)
    result = bytearray(output.getvalue())
    if streaming_header:
        struct.pack_into("<I", result, 40, 0xFFFFFFFF)
    return bytes(result)


def test_split_keeps_all_words_within_speech_limit():
    text = "memory " * 1300
    chunks = narration.split_for_speech(text)
    assert len(chunks) > 1
    assert all(len(chunk) <= narration.MAX_CHUNK for chunk in chunks)
    assert " ".join(chunks) == text.strip()


def test_long_narration_combines_wav_frames(monkeypatch):
    monkeypatch.setattr(narration.settings, "OPENAI_API_KEY", "test-key")
    requests = []

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def post(self, url, headers, json):
            requests.append(json)
            return SimpleNamespace(content=make_wav(b"\0\0" * 100, streaming_header=True), raise_for_status=lambda: None)

    monkeypatch.setattr(narration.httpx, "AsyncClient", lambda **_: FakeClient())
    response = asyncio.run(narration._speech("a remembered moment " * 350))
    with wave.open(io.BytesIO(response.body), "rb") as audio:
        assert audio.getnframes() == len(requests) * 100
    assert len(requests) > 1
    assert all(len(request["input"]) <= 4096 for request in requests)
    assert response.headers["cache-control"] == "private, no-store"


def test_streaming_narration_yields_pcm_before_the_full_story(monkeypatch):
    monkeypatch.setattr(narration.settings, "OPENAI_API_KEY", "test-key")
    requests = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        async def aiter_bytes(self):
            yield b"first audio"
            yield b"second audio"

    class FakeStream:
        async def __aenter__(self):
            return FakeResponse()

        async def __aexit__(self, *_):
            return None

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        def stream(self, method, url, headers, json):
            requests.append((method, url, headers, json))
            return FakeStream()

    monkeypatch.setattr(narration.httpx, "AsyncClient", lambda **_: FakeClient())

    async def collect():
        return [audio async for audio in narration._pcm_stream("A short remembered moment.")]

    assert asyncio.run(collect()) == [b"first audio", b"second audio"]
    assert requests[0][3]["response_format"] == "pcm"
    assert requests[0][3]["stream_format"] == "audio"


def test_unshared_public_memory_cannot_be_narrated(monkeypatch):
    monkeypatch.setattr(narration, "_enabled", lambda: None)
    monkeypatch.setattr(narration, "_published_detail", lambda *_: SimpleNamespace(
        stars=[SimpleNamespace(index=0, title="Private story", story_text=None)],
    ))
    session = SimpleNamespace(get=lambda *_: object())
    with pytest.raises(HTTPException) as error:
        asyncio.run(narration.narrate_public_memory(1, 0, session))
    assert error.value.status_code == 404


def test_missing_private_memory_is_not_narrated():
    session = SimpleNamespace(exec=lambda *_: SimpleNamespace(first=lambda: None))
    user = SimpleNamespace(id=7)
    with pytest.raises(HTTPException) as error:
        asyncio.run(narration.narrate_memory(99, session, user))
    assert error.value.status_code == 404


def test_published_audio_is_reused_until_revision_changes(monkeypatch):
    narration._public_cache.clear()
    calls = []

    async def fake_speech(text):
        calls.append(text)
        return Response(b"test audio", media_type="audio/wav")

    monkeypatch.setattr(narration, "_speech", fake_speech)
    first = asyncio.run(narration._public_speech((4, 1, None), "First story"))
    again = asyncio.run(narration._public_speech((4, 1, None), "First story"))
    revised = asyncio.run(narration._public_speech((4, 2, None), "Revised story"))
    assert first.body == again.body == revised.body
    assert calls == ["First story", "Revised story"]
    narration._public_cache.clear()
