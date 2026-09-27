import { IconButton, Tooltip } from "@chakra-ui/react"
import { useState } from "react"
import { FiVolume2, FiVolumeX } from "react-icons/fi"
import { setSoundEnabled, soundEnabled } from "../../lib/celebration"

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(soundEnabled)
  return (
    <Tooltip
      label={enabled ? "Celebration sounds on" : "Celebration sounds off"}
    >
      <IconButton
        aria-label={
          enabled ? "Mute celebration sounds" : "Enable celebration sounds"
        }
        aria-pressed={enabled}
        icon={enabled ? <FiVolume2 /> : <FiVolumeX />}
        variant="ghost"
        borderRadius="full"
        onClick={() => {
          setSoundEnabled(!enabled)
          setEnabled(!enabled)
        }}
      />
    </Tooltip>
  )
}
