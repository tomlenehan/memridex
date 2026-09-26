import { useCallback, useEffect, useRef, useState } from "react"

import type { ChatMessagePublic, ChatMessageSender } from "../client"
import { API_BASE_URL } from "../config"

export type VoiceStoryStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

interface RealtimeEvent {
  type: string
  delta?: string
  transcript?: string
  item_id?: string
  error?: { message?: string }
}

interface UseRealtimeStoryOptions {
  conversationId: number
  onUserMessage: (message: ChatMessagePublic) => void
  onAssistantStart: () => void
  onAssistantDelta: (delta: string) => void
  onAssistantComplete: () => void
  onConversationChanged: () => void
  onError: (message: string) => void
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Voice conversation could not start."

const waitForIceGathering = (connection: RTCPeerConnection) => {
  if (connection.iceGatheringState === "complete") return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeout)
      connection.removeEventListener("icegatheringstatechange", onStateChange)
      resolve()
    }
    const onStateChange = () => {
      if (connection.iceGatheringState === "complete") finish()
    }
    const timeout = window.setTimeout(finish, 4_000)

    connection.addEventListener("icegatheringstatechange", onStateChange)
  })
}

export function useRealtimeStory({
  conversationId,
  onUserMessage,
  onAssistantStart,
  onAssistantDelta,
  onAssistantComplete,
  onConversationChanged,
  onError,
}: UseRealtimeStoryOptions) {
  const [status, setStatus] = useState<VoiceStoryStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const callbacksRef = useRef({
    onUserMessage,
    onAssistantStart,
    onAssistantDelta,
    onAssistantComplete,
    onConversationChanged,
    onError,
  })
  const connectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const assistantTranscriptsRef = useRef(new Map<string, string>())
  const assistantStreamingRef = useRef(false)

  useEffect(() => {
    callbacksRef.current = {
      onUserMessage,
      onAssistantStart,
      onAssistantDelta,
      onAssistantComplete,
      onConversationChanged,
      onError,
    }
  }, [
    onAssistantComplete,
    onAssistantDelta,
    onAssistantStart,
    onConversationChanged,
    onError,
    onUserMessage,
  ])

  const clearConnection = useCallback(() => {
    dataChannelRef.current?.close()
    dataChannelRef.current = null
    connectionRef.current?.close()
    connectionRef.current = null
    for (const track of streamRef.current?.getTracks() || []) {
      track.stop()
    }
    streamRef.current = null
    audioRef.current?.pause()
    audioRef.current = null
    assistantTranscriptsRef.current.clear()
    assistantStreamingRef.current = false
  }, [])

  const persistMessage = useCallback(
    async (senderType: ChatMessageSender, content: string) => {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Please log in again to save this story.")

      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat_messages/${conversationId}/messages/persist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sender_type: senderType, content }),
        },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail || "Unable to save this story turn.")
      }

      return (await response.json()) as ChatMessagePublic
    },
    [conversationId],
  )

  const saveAssistantTranscript = useCallback(
    async (event: RealtimeEvent) => {
      const itemId = event.item_id || "assistant"
      const transcript =
        event.transcript || assistantTranscriptsRef.current.get(itemId) || ""
      if (!transcript.trim()) return

      const message = await persistMessage("ai", transcript.trim())
      assistantTranscriptsRef.current.delete(itemId)
      assistantStreamingRef.current = false
      callbacksRef.current.onAssistantComplete()
      callbacksRef.current.onConversationChanged()
      setStatus("connected")
      return message
    },
    [persistMessage],
  )

  const handleRealtimeEvent = useCallback(
    async (event: RealtimeEvent) => {
      try {
        switch (event.type) {
          case "session.created":
          case "session.updated":
            setStatus("connected")
            return
          case "input_audio_buffer.speech_started":
            setStatus("listening")
            return
          case "input_audio_buffer.speech_stopped":
            setStatus("thinking")
            return
          case "conversation.item.input_audio_transcription.completed": {
            if (!event.transcript?.trim()) return
            const message = await persistMessage(
              "user",
              event.transcript.trim(),
            )
            callbacksRef.current.onUserMessage(message)
            callbacksRef.current.onConversationChanged()
            return
          }
          case "response.output_audio_transcript.delta": {
            const itemId = event.item_id || "assistant"
            const current = assistantTranscriptsRef.current.get(itemId) || ""
            assistantTranscriptsRef.current.set(
              itemId,
              current + (event.delta || ""),
            )
            if (!assistantStreamingRef.current) {
              assistantStreamingRef.current = true
              callbacksRef.current.onAssistantStart()
            }
            if (event.delta) callbacksRef.current.onAssistantDelta(event.delta)
            setStatus("speaking")
            return
          }
          case "response.output_audio_transcript.done":
            await saveAssistantTranscript(event)
            return
          case "error":
            throw new Error(
              event.error?.message || "The voice service returned an error.",
            )
          default:
            return
        }
      } catch (eventError) {
        const message = getErrorMessage(eventError)
        setError(message)
        setStatus("error")
        callbacksRef.current.onError(message)
      }
    },
    [persistMessage, saveAssistantTranscript],
  )

  const start = useCallback(async () => {
    if (connectionRef.current) return
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      const message = "Voice conversations are not supported in this browser."
      setError(message)
      setStatus("error")
      callbacksRef.current.onError(message)
      return
    }

    const token = localStorage.getItem("access_token")
    if (!token) {
      const message = "Please log in again to start a voice conversation."
      setError(message)
      setStatus("error")
      callbacksRef.current.onError(message)
      return
    }

    setError(null)
    setStatus("connecting")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const connection = new RTCPeerConnection()
      connectionRef.current = connection
      for (const track of stream.getTracks()) {
        connection.addTrack(track, stream)
      }

      const audio = document.createElement("audio")
      audio.autoplay = true
      audioRef.current = audio
      connection.addEventListener("track", (event) => {
        const [remoteStream] = event.streams
        if (!remoteStream) return

        audio.srcObject = remoteStream
        void audio.play().catch(() => undefined)
      })

      const dataChannel = connection.createDataChannel("oai-events")
      dataChannelRef.current = dataChannel
      dataChannel.addEventListener("open", () => setStatus("connected"))
      dataChannel.addEventListener("message", (messageEvent) => {
        try {
          void handleRealtimeEvent(
            JSON.parse(messageEvent.data) as RealtimeEvent,
          )
        } catch {
          // Ignore malformed, non-JSON events while keeping the media stream alive.
        }
      })

      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      await waitForIceGathering(connection)
      const sdp = connection.localDescription?.sdp
      if (!sdp) throw new Error("Unable to prepare the voice connection.")

      const response = await fetch(
        `${API_BASE_URL}/api/v1/realtime/conversations/${conversationId}/realtime/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sdp }),
        },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(
          body?.detail || "Unable to start the voice conversation.",
        )
      }

      await connection.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      })
    } catch (startError) {
      clearConnection()
      const message = getErrorMessage(startError)
      setError(message)
      setStatus("error")
      callbacksRef.current.onError(message)
    }
  }, [clearConnection, conversationId, handleRealtimeEvent])

  const stop = useCallback(() => {
    clearConnection()
    setError(null)
    setStatus("idle")
  }, [clearConnection])

  const sendText = useCallback(
    async (content: string) => {
      const dataChannel = dataChannelRef.current
      if (!content.trim()) return false
      if (!dataChannel || dataChannel.readyState !== "open") return false

      const message = await persistMessage("user", content.trim())
      callbacksRef.current.onUserMessage(message)
      callbacksRef.current.onConversationChanged()
      dataChannel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: content.trim() }],
          },
        }),
      )
      dataChannel.send(
        JSON.stringify({
          type: "response.create",
          response: { output_modalities: ["audio"] },
        }),
      )
      setStatus("thinking")
      return true
    },
    [persistMessage],
  )

  useEffect(() => stop, [stop])

  return {
    error,
    isActive: status !== "idle" && status !== "error",
    sendText,
    start,
    status,
    stop,
  }
}
