import { useRef, useState } from "react"
import { FiPause, FiPlay, FiStar, FiVolume2 } from "react-icons/fi"

import "./homepage-voice-sample.css"

const sampleQuestion =
  "What's one place from your childhood you can still picture clearly, and what little detail comes back to you first?"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00"
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
}

export default function HomepageVoiceSample() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    setError(false)
    try {
      await audio.play()
    } catch {
      setError(true)
    }
  }

  return (
    <div className="homepage-voice-sample" aria-label="Listen to an example question">
      <div className="homepage-voice-header">
        <span className="homepage-voice-avatar" aria-hidden="true"><FiStar /></span>
        <div>
          <span className="homepage-voice-eyebrow">A LITTLE SPARK TO BEGIN</span>
          <strong>Hear your story companion</strong>
        </div>
        <FiVolume2 className="homepage-voice-speaker" aria-hidden="true" />
      </div>

      <p className="homepage-voice-question">“{sampleQuestion}”</p>

      <div className={`homepage-voice-wave ${playing ? "is-playing" : ""}`} aria-hidden="true">
        {[14, 25, 19, 32, 21, 38, 28, 16, 31, 22, 35, 18, 27, 15, 24, 12].map((height, index) => (
          <span key={index} style={{ height }} />
        ))}
      </div>

      <div className="homepage-voice-controls">
        <button
          aria-label={playing ? "Pause example AI question" : "Play example AI question"}
          className="homepage-voice-play"
          onClick={togglePlayback}
          type="button"
        >
          {playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
          {playing ? "Pause question" : "Play question"}
        </button>
        <span className="homepage-voice-time" aria-label="Audio playback time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <progress
        aria-label="Question audio playback progress"
        className="homepage-voice-progress"
        max={duration || 1}
        value={currentTime}
      />
      <span className="homepage-voice-disclosure">Example of an AI-generated voice</span>
      {error && <p className="homepage-voice-error" role="alert">The sample couldn’t play. Please try again.</p>}
      <audio
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
        src="/sounds/homepage-question.mp3"
      />
    </div>
  )
}
