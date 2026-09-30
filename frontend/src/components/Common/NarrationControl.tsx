import { Button, HStack, Text } from "@chakra-ui/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { FiPause, FiPlay, FiSquare } from "react-icons/fi"
import { API_BASE_URL } from "../../config"

let stopOtherNarration: (() => void) | null = null
const PCM_SAMPLE_RATE = 24_000
const MIN_INITIAL_BUFFER_BYTES = Math.round(PCM_SAMPLE_RATE * 2 * 0.35)

export default function NarrationControl({ path, publicStory = false }: { path: string; publicStory?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "paused">("idle")
  const [error, setError] = useState("")
  const audio = useRef<HTMLAudioElement | null>(null)
  const controller = useRef<AbortController | null>(null)
  const objectUrl = useRef<string | null>(null)
  const context = useRef<AudioContext | null>(null)
  const sources = useRef(new Set<AudioBufferSourceNode>())

  const stop = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    audio.current?.pause()
    audio.current = null
    for (const source of sources.current) source.stop()
    sources.current.clear()
    const currentContext = context.current
    context.current = null
    if (currentContext && currentContext.state !== "closed") void currentContext.close()
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = null
    if (stopOtherNarration === stop) stopOtherNarration = null
    setPhase("idle")
  }, [])

  useEffect(() => () => stop(), [path, stop])

  const fetchHeaders = (): HeadersInit => {
    const token = localStorage.getItem("access_token")
    if (!publicStory && !token) throw new Error("Please sign in again to listen.")
    return !publicStory && token ? { Authorization: `Bearer ${token}` } : {}
  }

  const startBufferedPlayback = async (request: AbortController, headers: HeadersInit) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/narration/${path}`, {
      method: "POST", signal: request.signal, headers,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.detail || "Voice reading is unavailable. Please try again.")
    }
    const blob = await response.blob()
    if (request.signal.aborted) return
    objectUrl.current = URL.createObjectURL(blob)
    const player = new Audio(objectUrl.current)
    audio.current = player
    player.onended = stop
    player.onerror = () => { stop(); setError("Your browser couldn't play this recording.") }
    await player.play()
    if (!request.signal.aborted) setPhase("playing")
  }

  const startStreamingPlayback = async (
    request: AbortController,
    headers: HeadersInit,
    playerContext: AudioContext,
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/narration/${path}?stream=true`, {
      method: "POST", signal: request.signal, headers,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.detail || "Voice reading is unavailable. Please try again.")
    }
    if (!response.body) throw new Error("Your browser couldn't receive the voice recording.")

    const reader = response.body.getReader()
    let started = false
    let finished = false
    let nextStart = 0
    let partial = new Uint8Array(0)
    let buffered: Uint8Array[] = []
    let bufferedBytes = 0

    const finishWhenDone = () => {
      if (finished && sources.current.size === 0 && !request.signal.aborted) stop()
    }
    const schedule = (bytes: Uint8Array) => {
      const alignedLength = bytes.byteLength - (bytes.byteLength % 2)
      if (!alignedLength) return
      const data = new DataView(bytes.buffer, bytes.byteOffset, alignedLength)
      const samples = new Float32Array(alignedLength / 2)
      for (let index = 0; index < samples.length; index += 1) samples[index] = data.getInt16(index * 2, true) / 32_768
      const buffer = playerContext.createBuffer(1, samples.length, PCM_SAMPLE_RATE)
      buffer.copyToChannel(samples, 0)
      const source = playerContext.createBufferSource()
      source.buffer = buffer
      source.connect(playerContext.destination)
      source.onended = () => { sources.current.delete(source); finishWhenDone() }
      const startAt = Math.max(nextStart, playerContext.currentTime + (started ? 0.02 : 0.12))
      source.start(startAt)
      nextStart = startAt + buffer.duration
      started = true
      sources.current.add(source)
      setPhase("playing")
    }
    const flushInitialBuffer = () => {
      if (!bufferedBytes) return
      const joined = new Uint8Array(bufferedBytes)
      let offset = 0
      for (const item of buffered) { joined.set(item, offset); offset += item.length }
      buffered = []
      bufferedBytes = 0
      schedule(joined)
    }

    try {
      while (!request.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break
        const incoming = new Uint8Array(partial.length + value.length)
        incoming.set(partial)
        incoming.set(value, partial.length)
        const usableLength = incoming.length - (incoming.length % 2)
        partial = incoming.slice(usableLength)
        const usable = incoming.slice(0, usableLength)
        if (!usable.length) continue
        if (!started) {
          buffered.push(usable)
          bufferedBytes += usable.length
          if (bufferedBytes >= MIN_INITIAL_BUFFER_BYTES) flushInitialBuffer()
        } else {
          schedule(usable)
        }
      }
      finished = true
      if (!started) flushInitialBuffer()
      finishWhenDone()
    } finally {
      reader.releaseLock()
    }
  }

  const toggle = async () => {
    if (phase === "playing") {
      if (context.current) await context.current.suspend()
      else audio.current?.pause()
      setPhase("paused")
      return
    }
    if (phase === "paused" && (audio.current || context.current)) {
      try {
        if (context.current) await context.current.resume()
        else await audio.current?.play()
        setPhase("playing")
      } catch {
        setError("Your browser couldn't play this recording.")
      }
      return
    }
    if (phase === "loading") return
    stopOtherNarration?.()
    stopOtherNarration = stop
    const request = new AbortController()
    controller.current = request
    setError("")
    setPhase("loading")
    try {
      const headers = fetchHeaders()
      if ("AudioContext" in window) {
        const playerContext = new AudioContext({ sampleRate: PCM_SAMPLE_RATE })
        context.current = playerContext
        await playerContext.resume()
        await startStreamingPlayback(request, headers, playerContext)
      } else {
        await startBufferedPlayback(request, headers)
      }
    } catch (cause) {
      if (!request.signal.aborted) {
        stop()
        setError(cause instanceof Error ? cause.message : "Voice reading is unavailable.")
      }
    }
  }

  return <div>
    <HStack spacing={2} flexWrap="wrap">
      <Button type="button" size="sm" variant="outline" leftIcon={phase === "playing" ? <FiPause /> : <FiPlay />}
        onClick={toggle} isLoading={phase === "loading"} loadingText="Preparing voice" minH="44px">
        {phase === "playing" ? "Pause" : phase === "paused" ? "Resume" : "Listen"}
      </Button>
      {phase !== "idle" && <Button type="button" size="sm" variant="ghost" leftIcon={<FiSquare />}
        onClick={stop} minH="44px">Stop</Button>}
      <Text fontSize="xs" color="ui.muted">AI-generated voice</Text>
    </HStack>
    {error && <Text role="alert" color="red.600" fontSize="sm" mt={2}>{error}</Text>}
  </div>
}
