import { Box, Center, Icon, type BoxProps } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { FiStar } from "react-icons/fi"

type ConstellationStarProps = BoxProps & {
  label?: string
  mood?: "default" | "complete" | "in-progress" | "suggested" | "celebration"
  loop?: boolean
}

const animationPath = `${import.meta.env.BASE_URL}animations/constellation-star.json`
let animationDataRequest: Promise<Record<string, unknown>> | null = null

const moodPalettes = {
  complete: { body: "#F8D881", outline: "#D88B4A", glow: "#FFE6A3", accent: "#4B8D82", twinkle: "#4B8D82", cheek: "#E39079" },
  "in-progress": { body: "#A9D8C8", outline: "#4B8D82", glow: "#BFE8D5", accent: "#347C76", twinkle: "#7AB9A5", cheek: "#DF9B88" },
  suggested: { body: "#D8C7EB", outline: "#947BB1", glow: "#E8DDF4", accent: "#588D87", twinkle: "#A8C8C0", cheek: "#E5A08E" },
  celebration: { body: "#FFD66F", outline: "#DA8843", glow: "#FFE9A8", accent: "#317F75", twinkle: "#78BDA8", cheek: "#E68E76" },
} as const

function getAnimationData() {
  animationDataRequest ??= fetch(animationPath)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the constellation star animation")
      return response.json() as Promise<Record<string, unknown>>
    })
    .catch((error: unknown) => {
      animationDataRequest = null
      throw error
    })
  return animationDataRequest
}

function hexToLottieColor(hex: string) {
  const value = hex.replace("#", "")
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255).concat(1)
}

function recolorShapes(shapes: unknown, color: number[]) {
  if (!Array.isArray(shapes)) return
  for (const shape of shapes) {
    if (!shape || typeof shape !== "object") continue
    const item = shape as { ty?: string; c?: { k?: unknown }; it?: unknown[]; shapes?: unknown[] }
    if ((item.ty === "fl" || item.ty === "st") && item.c && Array.isArray(item.c.k) && item.c.k.every((part) => typeof part === "number")) {
      item.c.k = [...color]
    }
    recolorShapes(item.it, color)
    recolorShapes(item.shapes, color)
  }
}

async function animationForMood(mood: ConstellationStarProps["mood"]) {
  const source = await getAnimationData()
  if (!mood || mood === "default") return JSON.parse(JSON.stringify(source)) as Record<string, unknown>

  const animation = JSON.parse(JSON.stringify(source)) as { layers?: Array<{ nm?: string; shapes?: unknown[] }> }
  const palette = moodPalettes[mood]
  const layerColors: Record<string, string> = {
    "Little stars — alternating twinkle": palette.twinkle,
    "Rosy cheeks": palette.cheek,
    "Star character — warm gold": palette.body,
    "Dancing little feet": palette.accent,
    Halo: palette.glow,
    "Constellation thread": palette.twinkle,
    "Grounding shadow": palette.accent,
  }
  for (const layer of animation.layers ?? []) {
    const color = layerColors[layer.nm ?? ""]
    if (color) recolorShapes(layer.shapes, hexToLottieColor(color))
    if (layer.nm === "Star character — warm gold") {
      const paletteOutline = palette.outline
      recolorStroke(layer.shapes, hexToLottieColor(paletteOutline))
    }
  }
  return animation
}

function recolorStroke(shapes: unknown, color: number[]) {
  if (!Array.isArray(shapes)) return
  for (const shape of shapes) {
    if (!shape || typeof shape !== "object") continue
    const item = shape as { ty?: string; c?: { k?: unknown }; it?: unknown[]; shapes?: unknown[] }
    if (item.ty === "st" && item.c && Array.isArray(item.c.k) && item.c.k.every((part) => typeof part === "number")) {
      item.c.k = [...color]
    }
    recolorStroke(item.it, color)
    recolorStroke(item.shapes, color)
  }
}

function ConstellationStar({ label, mood = "default", loop = true, ...boxProps }: ConstellationStarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const fallbackColor = mood === "suggested" ? "#947BB1" : mood === "in-progress" ? "#4B8D82" : "#D88B4A"
  const moodTransform = mood === "suggested" ? "rotate(-7deg)" : mood === "complete" ? "rotate(2deg)" : mood === "celebration" ? "scale(1.04)" : undefined

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    setReady(false)

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let disposed = false
    let animation: import("lottie-web").AnimationItem | null = null

    const syncMotion = () => {
      if (!animation) return
      if (motionPreference.matches) animation.goToAndStop(0, true)
      else animation.play()
    }

    motionPreference.addEventListener("change", syncMotion)

    void Promise.all([
      import("lottie-web/build/player/lottie_light"),
      animationForMood(mood),
    ]).then(([{ default: lottie }, animationData]) => {
        if (disposed) return
        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop,
          autoplay: !motionPreference.matches,
          animationData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", focusable: false },
        })
        animation.addEventListener("DOMLoaded", () => {
          if (disposed) return
          syncMotion()
          setReady(true)
        })
        animation.addEventListener("complete", () => {
          if (!loop) animation?.goToAndStop(0, true)
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
  }, [loop, mood])

  return (
    <Box
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      flexShrink={0}
      h="160px"
      position="relative"
      w="160px"
      transform={moodTransform}
      {...boxProps}
    >
      {!ready && (
        <Center inset={0} position="absolute" aria-hidden="true">
          <Icon as={FiStar} boxSize="34%" color={fallbackColor} />
        </Center>
      )}
      <Box aria-hidden="true" h="full" ref={containerRef} w="full" />
    </Box>
  )
}

export default ConstellationStar
