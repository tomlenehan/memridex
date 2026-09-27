import { Box, Center, Icon, type BoxProps } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { FiStar } from "react-icons/fi"

type ConstellationStarProps = BoxProps & {
  label?: string
}

const animationPath = `${import.meta.env.BASE_URL}animations/constellation-star.json`

function ConstellationStar({ label, ...boxProps }: ConstellationStarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let disposed = false
    let animation: import("lottie-web").AnimationItem | null = null

    const syncMotion = () => {
      if (!animation) return
      if (motionPreference.matches) animation.goToAndStop(0, true)
      else animation.play()
    }

    motionPreference.addEventListener("change", syncMotion)

    void import("lottie-web/build/player/lottie_light")
      .then(({ default: lottie }) => {
        if (disposed) return
        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: !motionPreference.matches,
          path: animationPath,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", focusable: false },
        })
        animation.addEventListener("DOMLoaded", () => {
          if (disposed) return
          syncMotion()
          setReady(true)
        })
      })
      .catch(() => {
        // Keep the static star visible if the animation cannot load.
      })

    return () => {
      disposed = true
      motionPreference.removeEventListener("change", syncMotion)
      animation?.destroy()
    }
  }, [])

  return (
    <Box
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      flexShrink={0}
      h="160px"
      position="relative"
      w="160px"
      {...boxProps}
    >
      {!ready && (
        <Center inset={0} position="absolute" aria-hidden="true">
          <Icon as={FiStar} boxSize="34%" color="#D88B4A" />
        </Center>
      )}
      <Box aria-hidden="true" h="full" ref={containerRef} w="full" />
    </Box>
  )
}

export default ConstellationStar
