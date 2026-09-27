import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { FiArrowRight, FiBookOpen, FiMic, FiPenTool } from "react-icons/fi"

import background from "../assets/images/homepage_parallax/background.png"
import foreground from "../assets/images/homepage_parallax/foreground.png"
import midground from "../assets/images/homepage_parallax/midground.png"
import memriPlaceLogo from "../assets/images/MemriPlaceMLogoLG.png"
import memriPlaceTextLogo from "../assets/images/MemriPlaceTextLogo.png"
import star from "../assets/images/homepage_parallax/star.png"
import starscape from "../assets/images/homepage_parallax/starscape.png"
import AuthModal from "../components/Auth/AuthModal"

export type AuthModalMode = "login" | "signup"

export const Route = createFileRoute("/landing")({
  component: LandingRoute,
})

function LandingRoute() {
  return <LandingPage />
}

const storybookHeading = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  fontWeight: 600,
  letterSpacing: 0,
}

const storySteps = [
  {
    icon: FiBookOpen,
    index: "01",
    text: "Start with a prompt or a moment already on your mind.",
    title: "Begin anywhere",
  },
  {
    icon: FiMic,
    index: "02",
    text: "Speak or type or type to a friendly AI .",
    title: "Follow the memory",
  },
  {
    icon: FiPenTool,
    index: "03",
    text: "Keep a story you can return to and share.",
    title: "Make it lasting",
  },
]

export function LandingPage({
  initialAuthMode = null,
}: {
  initialAuthMode?: AuthModalMode | null
} = {}) {
  const parallaxTrackRef = useRef<HTMLDivElement>(null)
  const storyStepsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const track = parallaxTrackRef.current
    if (!track) return

    let frame: number | null = null
    const layerDistances: Record<string, number> = {
      background: -15,
      starscape: -58,
      midground: -102,
      foreground: -168,
    }

    const updateProgress = () => {
      frame = null
      const scene = track.querySelector<HTMLElement>("[data-parallax-scene]")
      if (!scene) return

      const trackTop = track.getBoundingClientRect().top + window.scrollY
      const scrollDistance = Math.max(
        track.offsetHeight - scene.offsetHeight,
        1,
      )
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - trackTop) / scrollDistance),
      )

      for (const layer of track.querySelectorAll<HTMLElement>(
        "[data-parallax-layer]",
      )) {
        const depth = layerDistances[layer.dataset.parallaxLayer ?? ""] ?? 0
        const offset = depth * progress
        layer.style.setProperty("--parallax-offset", `${offset}px`)
        layer.style.setProperty(
          "--parallax-fade-size",
          `${Math.abs(offset) + 24}px`,
        )
      }

      const copy = track.querySelector<HTMLElement>("[data-parallax-copy]")
      copy?.style.setProperty("--copy-offset", `${-24 * progress}px`)
      copy?.style.setProperty("--copy-opacity", `${1 - progress * 0.12}`)
    }

    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateProgress)
    }

    scheduleUpdate()
    window.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
    }
  }, [])

  useEffect(() => {
    const steps = storyStepsRef.current?.querySelectorAll<HTMLElement>(
      "[data-scroll-reveal]",
    )
    if (!steps?.length) return

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      for (const step of steps) step.dataset.revealed = "true"
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const step = entry.target as HTMLElement
          step.dataset.revealed = "true"
          observer.unobserve(step)
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )

    steps.forEach((step, index) => {
      step.style.setProperty("--scroll-reveal-delay", `${index * 120}ms`)
      observer.observe(step)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <Box bg="#F8F4E9" color="#12313A" minH="100vh">
      <Box as="main">
        <Box
          ref={parallaxTrackRef}
          as="section"
          h={{ base: "160svh", md: "175svh" }}
          position="relative"
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              height: "100svh",
              "& [data-parallax-scene]": {
                position: "relative",
                top: "auto",
              },
            },
          }}
        >
          <Box
            data-parallax-scene="true"
            bg="#071F27"
            color="#FFF8E8"
            h="100svh"
            minH="600px"
            overflow="hidden"
            position="sticky"
            top={0}
          >
            <Image
              alt=""
              aria-hidden="true"
              data-parallax-layer="background"
              h="100%"
              maxW="none"
              objectFit="cover"
              position="absolute"
              src={background}
              top={0}
              transform="translate3d(0, var(--parallax-offset, 0px), 0) scale(1.08)"
              transformOrigin="center"
              w="100%"
              zIndex={0}
            />
            <Image
              alt=""
              aria-hidden="true"
              data-parallax-layer="starscape"
              h="100%"
              inset={0}
              maxW="none"
              objectFit="cover"
              opacity={0.76}
              position="absolute"
              src={starscape}
              sx={{
                maskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
              }}
              transform="translate3d(0, var(--parallax-offset, 0px), 0) scale(1.06)"
              w="100%"
              zIndex={1}
            />
            <Image
              alt=""
              aria-hidden="true"
              data-parallax-layer="midground"
              h="100%"
              inset={0}
              maxW="none"
              objectFit="cover"
              opacity={0.96}
              position="absolute"
              src={midground}
              sx={{
                maskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
              }}
              transform="translate3d(0, var(--parallax-offset, 0px), 0) scale(1.08)"
              w="100%"
              zIndex={2}
            />

            <Box
              aria-hidden="true"
              bg="linear-gradient(90deg, rgba(3, 19, 24, 0.86) 0%, rgba(3, 19, 24, 0.58) 44%, rgba(3, 19, 24, 0.10) 78%, rgba(3, 19, 24, 0.02) 100%)"
              inset={0}
              position="absolute"
              zIndex={3}
            />

            <Flex
              align="center"
              justify="space-between"
              maxW="7xl"
              mx="auto"
              px={{ base: 5, md: 8 }}
              py={{ base: 5, md: 7 }}
              position="relative"
              zIndex={6}
            >
              <Image
                alt="MemriPlace"
                boxSize={{ base: "44px", md: "54px" }}
                display="block"
                objectFit="contain"
                src={memriPlaceLogo}
              />
              <HStack spacing={{ base: 1, md: 3 }}>
                <Button
                  _hover={{ bg: "whiteAlpha.200" }}
                  as={Link}
                  color="#FFF8E8"
                  size={{ base: "sm", md: "md" }}
                  to="/login"
                  variant="ghost"
                >
                  Log in
                </Button>
                <Button
                  as={Link}
                  rightIcon={<FiArrowRight />}
                  size={{ base: "sm", md: "md" }}
                  to="/signup"
                  variant="accent"
                >
                  Start
                </Button>
              </HStack>
            </Flex>

            <Flex
              align={{ base: "flex-start", md: "center" }}
              h="calc(100% - 84px)"
              mx="auto"
              pb={{ base: 16, md: 20 }}
              pt={{ base: 16, md: 10 }}
              px={{ base: 5, md: 8 }}
              position="relative"
              w="full"
              zIndex={4}
            >
              <Stack
                data-parallax-copy="true"
                maxW={{ base: "340px", sm: "420px", md: "760px" }}
                mx={{ base: 0, md: "max(5vw, calc((100vw - 1280px) / 2))" }}
                spacing={{ base: 4, md: 5 }}
                sx={{
                  opacity: "var(--copy-opacity, 1)",
                  transform: "translate3d(0, var(--copy-offset, 0px), 0)",
                  willChange: "transform, opacity",
                }}
              >
                <Text color="#F4D98D" fontSize="sm" fontWeight="bold">
                  Stories worth keeping
                </Text>
                <Heading as="h1" lineHeight={0} maxW="100%">
                  <Image
                    alt="MemriPlace"
                    display="block"
                    maxW="100%"
                    objectFit="contain"
                    src={memriPlaceTextLogo}
                    w={{ base: "320px", sm: "430px", md: "650px" }}
                  />
                </Heading>
                <Text
                  color="rgba(255, 248, 232, 0.92)"
                  fontSize={{ base: "lg", md: "2xl" }}
                  lineHeight="1.35"
                  maxW="520px"
                  sx={storybookHeading}
                >
                  The permanent home for treasured memories.
                </Text>
                <Text
                  color="rgba(255, 248, 232, 0.78)"
                  lineHeight="1.7"
                  maxW="460px"
                >
                  Turn a remembered moment into a story you can revisit, and share.
                </Text>
                <HStack flexWrap="wrap" pt={2} spacing={3}>
                  <Button
                    as={Link}
                    rightIcon={<FiArrowRight />}
                    size="lg"
                    to="/signup"
                    variant="accent"
                  >
                    Start a story
                  </Button>
                  <Button
                    _hover={{ bg: "whiteAlpha.200" }}
                    as={Link}
                    borderColor="rgba(255, 248, 232, 0.62)"
                    borderWidth="1px"
                    color="#FFF8E8"
                    size="lg"
                    to="/login"
                    variant="ghost"
                  >
                    Continue writing
                  </Button>
                </HStack>
              </Stack>
            </Flex>

            <Image
              alt=""
              aria-hidden="true"
              data-parallax-layer="foreground"
              h="100%"
              inset={0}
              maxW="none"
              objectFit="cover"
              objectPosition={{ base: "56% center", md: "center" }}
              pointerEvents="none"
              position="absolute"
              src={foreground}
              sx={{
                maskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - var(--parallax-fade-size, 24px)), transparent 100%)",
              }}
              transform="translate3d(0, var(--parallax-offset, 0px), 0) scale(1.1)"
              w="100%"
              zIndex={5}
            />
          </Box>
        </Box>

        <Box bg="#F8F4E9" pb={{ base: 16, md: 24 }} pt={{ base: 14, md: 12 }}>
          <Stack
            maxW="7xl"
            mx="auto"
            px={{ base: 5, md: 8 }}
            spacing={{ base: 10, md: 14 }}
          >
            <Stack maxW="610px" spacing={3}>
              <Text color="#2E7A78" fontSize="sm" fontWeight="bold">
                A simple place to begin
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "38px", md: "58px" }}
                lineHeight="1"
                sx={storybookHeading}
              >
                From a small spark to a story.
              </Heading>
              <Text
                color="#526A70"
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="1.7"
              >
                Nothing complicated. Just room to remember, in the way that
                feels natural to you.
              </Text>
            </Stack>

            <SimpleGrid
              columns={{ base: 1, md: 3 }}
              ref={storyStepsRef}
              spacing={{ base: 8, md: 10 }}
              sx={{
                "@media (prefers-reduced-motion: no-preference)": {
                  "& [data-scroll-reveal]": {
                    opacity: 0,
                    transform: "translate3d(0, 18px, 0)",
                    transition:
                      "opacity 650ms ease, transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDelay: "var(--scroll-reveal-delay, 0ms)",
                  },
                  '& [data-scroll-reveal][data-revealed="true"]': {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                  },
                },
              }}
            >
              {storySteps.map((step) => (
                <Stack
                  borderColor="#D7CFAF"
                  borderTop="1px solid"
                  data-revealed="false"
                  data-scroll-reveal="true"
                  key={step.index}
                  pt={5}
                  spacing={4}
                >
                  <Flex align="center" color="#2E7A78" gap={3}>
                    <Text fontSize="sm" fontWeight="bold">
                      {step.index}
                    </Text>
                    <Flex
                      align="center"
                      bg="#E7EEE8"
                      boxSize="38px"
                      justify="center"
                    >
                      <Icon as={step.icon} boxSize={5} />
                    </Flex>
                  </Flex>
                  <Heading
                    as="h3"
                    fontSize={{ base: "28px", md: "32px" }}
                    lineHeight="1.05"
                    sx={storybookHeading}
                  >
                    {step.title}
                  </Heading>
                  <Text color="#526A70" lineHeight="1.7" maxW="330px">
                    {step.text}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Box>

        <Box
          bg="#12313A"
          color="#FFF8E8"
          overflow="hidden"
          position="relative"
          py={{ base: 20, md: 28 }}
        >
          <Image
            alt=""
            aria-hidden="true"
            filter="drop-shadow(0 0 18px rgba(241, 204, 119, 0.24))"
            opacity={0.28}
            position="absolute"
            right={{ base: "8px", md: "8%" }}
            src={star}
            top={{ base: "24px", md: "20px" }}
            w={{ base: "190px", md: "310px" }}
            sx={{
              "@keyframes memory-star-drift": {
                from: { transform: "translate3d(0, 0, 0) rotate(-3deg)" },
                to: { transform: "translate3d(-12px, 14px, 0) rotate(2deg)" },
              },
              animation: "memory-star-drift 24s ease-in-out infinite alternate",
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          />
          <Flex
            align={{ base: "flex-start", md: "flex-end" }}
            direction={{ base: "column", md: "row" }}
            gap={8}
            justify="space-between"
            maxW="7xl"
            mx="auto"
            px={{ base: 5, md: 8 }}
            position="relative"
          >
            <Stack maxW="660px" spacing={4}>
              <Text color="#F1CC77" fontSize="sm" fontWeight="bold">
                Your words, your way
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "40px", md: "64px" }}
                lineHeight="1"
                sx={storybookHeading}
              >
                Every story starts with one small moment.
              </Heading>
              <Text
                color="rgba(255, 248, 232, 0.78)"
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="1.7"
              >
                Give it a place to land.
              </Text>
            </Stack>
            <Button
              as={Link}
              flexShrink={0}
              rightIcon={<FiArrowRight />}
              size="lg"
              to="/signup"
              variant="accent"
            >
              Begin yours
            </Button>
          </Flex>
        </Box>
      </Box>

      <Flex
        align="center"
        bg="#0B252D"
        color="rgba(255, 248, 232, 0.7)"
        direction={{ base: "column", sm: "row" }}
        gap={2}
        justify="space-between"
        px={{ base: 5, md: 8 }}
        py={5}
      >
        <Text fontSize="sm">MemriPlace. Stories worth keeping.</Text>
        <Text fontSize="sm">© {new Date().getFullYear()}</Text>
      </Flex>
      {initialAuthMode && (
        <AuthModal
          isOpen
          mode={initialAuthMode}
          onClose={() => navigate({ to: "/landing" })}
        />
      )}
    </Box>
  )
}

export default LandingPage
