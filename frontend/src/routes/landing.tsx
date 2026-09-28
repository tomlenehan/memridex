import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import {
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiLock,
  FiMic,
  FiStar,
  FiSun,
} from "react-icons/fi"

import background from "../assets/images/homepage_parallax_flat/background.png"
import foreground from "../assets/images/homepage_parallax_flat/foreground3.png"
import midground from "../assets/images/homepage_parallax_flat/midground.png"
import memriPlaceLogo from "../assets/images/MemriPlaceLighterLogo.png"
import memriPlaceTextLogo from "../assets/images/MemriPlaceTextLogoFlat.png"
import starscape from "../assets/images/homepage_parallax_flat/starscape.png"
import AuthModal from "../components/Auth/AuthModal"
import ConstellationStar from "../components/Common/ConstellationStar"

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
    text: "A childhood kitchen. A familiar laugh. Start with a gentle question or a moment already on your mind.",
    title: "Find a little spark",
    color: "#FFF0BF",
  },
  {
    icon: FiMic,
    index: "02",
    text: "Your AI companion will ask you a few thoughtful questions help bring the little details back.",
    title: "Follow the memory",
    color: "#DDEDE1",
  },
  {
    icon: FiStar,
    index: "03",
    text: "Save your story to add a star to your constellation. Come back whenever a new memory finds you.",
    title: "Watch your sky grow",
    color: "#E9DFF1",
  },
]

const exampleMemories = [
  {
    title: "Grandma’s kitchen",
    color: "#F5D785",
    x: 25,
    y: 22,
    text: "There was always flour on the kitchen table, and somehow she never minded how much of it ended up on me.",
  },
  {
    title: "The garden gate",
    color: "#B9DDCF",
    x: 74,
    y: 33,
    text: "Beyond the little green gate was a garden that felt like a whole other world. Grandma knew the name of every flower.",
  },
  {
    title: "Sunday pancakes",
    color: "#F2C6AE",
    x: 29,
    y: 65,
    text: "On Sundays we took our time. Dad made the first pancake too big, every single week, and we laughed every single time.",
  },
  {
    title: "A summer of stories",
    color: "#D8C9E6",
    x: 72,
    y: 70,
    text: "We spent the long afternoons under the apple tree, listening to stories we would ask to hear all over again tomorrow.",
  },
]

function ConstellationPreview() {
  const [selected, setSelected] = useState(0)
  const memory = exampleMemories[selected]
  return (
    <Box
      bg="#FCFDF6"
      border="1px solid #DCE5D1"
      borderRadius="30px"
      overflow="hidden"
      boxShadow="0 7px 0 #E2E8D5, 0 20px 50px rgba(44,74,52,.07)"
    >
      <Flex
        px={{ base: 5, md: 7 }}
        pt={6}
        justify="space-between"
        align="center"
        gap={3}
      >
        <HStack color="#426858">
          <Icon as={FiStar} />
          <Text fontWeight="800" fontSize="sm">
            A little universe of memories
          </Text>
        </HStack>
        <Text fontSize="xs" color="#617569" whiteSpace="nowrap">
          Example map
        </Text>
      </Flex>
      <Box
        position="relative"
        h={{ base: "310px", md: "350px" }}
        mx={3}
        mt={3}
        bgImage="radial-gradient(#CCD8C1 1px, transparent 1px)"
        bgSize="24px 24px"
      >
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {[
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
          ].map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={`${exampleMemories[a].x}%`}
              y1={`${exampleMemories[a].y}%`}
              x2={`${exampleMemories[b].x}%`}
              y2={`${exampleMemories[b].y}%`}
              stroke={selected === a || selected === b ? "#7FA284" : "#CAD6BE"}
              strokeWidth="2"
              strokeDasharray="5 7"
            />
          ))}
        </svg>
        {exampleMemories.map((item, index) => (
          <Box
            key={item.title}
            position="absolute"
            left={`${item.x}%`}
            top={`${item.y}%`}
            transform="translate(-50%, -32px)"
            w={{ base: "120px", md: "150px" }}
            textAlign="center"
          >
            <Button
              aria-label={`Preview ${item.title}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              variant="unstyled"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              boxSize="64px"
              borderRadius="22px"
              bg={item.color}
              border="3px solid white"
              color="#426454"
              transform={`rotate(${index % 2 ? 7 : -7}deg)`}
              boxShadow={
                selected === index
                  ? "0 0 0 3px #729479, 0 6px 0 #C5D2BB"
                  : "0 5px 0 #D2DBC4"
              }
              _hover={{ transform: "rotate(0deg) translateY(-3px)" }}
            >
              <Icon as={FiStar} boxSize={7} fill="rgba(255,255,255,.6)" />
            </Button>
            <Text
              mt={3}
              fontWeight="700"
              fontSize="sm"
              lineHeight="1.4"
              color="#365846"
              bg="#FCFDF6"
              borderRadius="lg"
            >
              {item.title}
            </Text>
          </Box>
        ))}
      </Box>
      <Box
        px={{ base: 5, md: 7 }}
        pt={5}
        pb={6}
        bg="white"
        borderTop="1px solid #E3E9DA"
        minH={{ base: "184px", md: "168px" }}
        aria-live="polite"
        aria-atomic="true"
      >
        <Text fontSize="xs" color="#617569" mb={2}>
          Tap a star. There’s a story behind each one.
        </Text>
        <Heading as="h3" fontSize="xl" sx={storybookHeading}>
          {memory.title}
        </Heading>
        <Text color="#617569" fontSize="sm" lineHeight="1.7" mt={2}>
          {memory.text}
        </Text>
      </Box>
    </Box>
  )
}

export function LandingPage({
  initialAuthMode = null,
}: {
  initialAuthMode?: AuthModalMode | null
} = {}) {
  const parallaxTrackRef = useRef<HTMLDivElement>(null)
  const storyStepsRef = useRef<HTMLDivElement>(null)
  const [footerModal, setFooterModal] = useState<"contact" | "legal" | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const track = parallaxTrackRef.current
    const scene = track?.querySelector<HTMLElement>("[data-parallax-scene]")
    if (!track || !scene) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const layers = Array.from(scene.querySelectorAll<HTMLElement>("[data-parallax-layer]"))
    const copy = scene.querySelector<HTMLElement>("[data-parallax-copy]")
    let frame: number | null = null
    let current = 0
    let target = 0
    let lastTime = 0
    let sceneHeight = scene.offsetHeight
    let travel = 1

    const paint = (progress: number) => {
      const strength = window.innerWidth < 768 ? 0.6 : 1
      const depth = progress * strength
      // Push into the scene around the reader; near objects spread outward
      // while the horizon stays almost still. Scaling keeps every edge covered.
      const transforms: Record<string, [number, number, number]> = {
        background: [0, -sceneHeight * 0.012 * depth, 1.08 + 0.018 * depth],
        starscape: [-12 * depth, -sceneHeight * 0.075 * depth, 1.06 + 0.08 * depth],
        midground: [-8 * depth, -sceneHeight * 0.025 * depth, 1.08 + 0.075 * depth],
        foreground: [22 * depth, sceneHeight * 0.065 * depth, 1.1 + 0.19 * depth],
      }
      for (const layer of layers) {
        const [x, y, scale] = transforms[layer.dataset.parallaxLayer ?? ""] ?? [0, 0, 1]
        layer.style.setProperty("--layer-x", `${x}px`)
        layer.style.setProperty("--layer-y", `${y}px`)
        layer.style.setProperty("--layer-scale", `${scale}`)
      }
      copy?.style.setProperty("--copy-offset", `${-sceneHeight * 0.085 * depth}px`)
      copy?.style.setProperty("--copy-opacity", `${1 - progress * 0.1}`)
      copy?.style.setProperty("--logo-scale", `${1 - 0.04 * depth}`)
    }

    const animate = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16
      lastTime = time
      current += (target - current) * (1 - Math.exp(-elapsed / 65))
      const settled = Math.abs(target - current) < 0.0001
      if (settled) current = target
      paint(current)
      frame = settled ? null : window.requestAnimationFrame(animate)
      if (settled) lastTime = 0
    }

    const scheduleUpdate = () => {
      const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / travel))
      // A short ease-in avoids a sudden jump as the first scroll starts.
      target = reducedMotion.matches ? 0 : (1.08 * progress * progress) / (progress + 0.08)
      if (reducedMotion.matches) {
        if (frame !== null) window.cancelAnimationFrame(frame)
        frame = null
        current = 0
        lastTime = 0
        paint(0)
      } else if (frame === null && Math.abs(target - current) >= 0.0001) {
        frame = window.requestAnimationFrame(animate)
      }
    }

    const measure = () => {
      sceneHeight = scene.offsetHeight
      travel = Math.max(track.offsetHeight - sceneHeight, 1)
      paint(current)
      scheduleUpdate()
    }

    measure()
    current = target
    paint(current)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(track)
    resizeObserver.observe(scene)
    window.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", measure)
    reducedMotion.addEventListener("change", measure)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", measure)
      reducedMotion.removeEventListener("change", measure)
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
    <Box bg="#FAFBF2" color="#24483E" minH="100vh">
      <Box as="main">
        <Box
          ref={parallaxTrackRef}
          as="section"
          h={{ base: "160svh", md: "175svh" }}
          minH={{ base: "calc(600px + 60svh)", md: "calc(600px + 75svh)" }}
          position="relative"
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              height: "100svh",
              minHeight: "600px",
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
              transform="translate3d(var(--layer-x, 0px), var(--layer-y, 0px), 0) scale(var(--layer-scale, 1.08))"
              transformOrigin="70% 70%"
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
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
              }}
              transform="translate3d(var(--layer-x, 0px), var(--layer-y, 0px), 0) scale(var(--layer-scale, 1.06))"
              transformOrigin="70% 70%"
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
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
              }}
              transform="translate3d(var(--layer-x, 0px), var(--layer-y, 0px), 0) scale(var(--layer-scale, 1.08))"
              transformOrigin="70% 75%"
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
                  Begin your story
                </Button>
              </HStack>
            </Flex>

            <Flex
              align={{ base: "flex-start", md: "center" }}
              h="calc(100% - 84px)"
              mx="auto"
              pb={{ base: 16, md: 20 }}
              pt={{ base: 10, md: 10 }}
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
                  A little memory. A whole constellation.
                </Text>
                <Heading as="h1" lineHeight={0} maxW="100%">
                  <Image
                    alt="MemriPlace"
                    display="block"
                    maxW="100%"
                    objectFit="contain"
                    src={memriPlaceTextLogo}
                    transform="scale(var(--logo-scale, 1))"
                    transformOrigin="left center"
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
                  Life is full of memories and each one is a star.
                </Text>
                <Text
                  color="rgba(255, 248, 232, 0.78)"
                  lineHeight="1.7"
                  maxW="460px"
                >
                  Turn the moments you remember into stories you can keep.
                </Text>
                <HStack flexWrap="wrap" pt={2} spacing={3}>
                  <Button
                    as={Link}
                    rightIcon={<FiArrowRight />}
                    size="lg"
                    to="/signup"
                    variant="accent"
                  >
                    Light your first star
                  </Button>
                </HStack>
                {/*<HStack color="rgba(255,248,232,.85)" spacing={2} fontSize="sm">*/}
                {/*  <Icon as={FiLock} flexShrink={0} />*/}
                {/*  <Text>*/}
                {/*    Your constellation stays private. Share one story at a time,*/}
                {/*    only when you choose.*/}
                {/*  </Text>*/}
                {/*</HStack>*/}
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
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
              }}
              transform="translate3d(var(--layer-x, 0px), var(--layer-y, 0px), 0) scale(var(--layer-scale, 1.1))"
              transformOrigin="72% 100%"
              w="100%"
              zIndex={5}
            />
          </Box>
        </Box>

        <Box
          bg="#FAFBF2"
          pb={{ base: 16, md: 24 }}
          pt={{ base: 10, md: 12 }}
          position="relative"
        >
          <Stack
            maxW="7xl"
            mx="auto"
            px={{ base: 5, md: 8 }}
            spacing={{ base: 10, md: 14 }}
          >
            <Flex
              align="center"
              direction={{ base: "column-reverse", md: "row" }}
              gap={{ base: 4, md: 10 }}
              justify="space-between"
            >
              <Stack maxW="660px" spacing={3}>
                <Text color="#2E7A78" fontSize="sm" fontWeight="bold">
                  BIG STORIES START SMALL
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "38px", md: "58px" }}
                  lineHeight="1"
                  sx={storybookHeading}
                >
                  A familiar voice. A favorite place. A little spark.
                </Heading>
                <Text
                  color="#526A70"
                  fontSize={{ base: "md", md: "lg" }}
                  lineHeight="1.7"
                >
                  You don’t need to know where to begin. A friendly companion, a
                  gentle question, and a little curiosity are all it takes.
                </Text>
              </Stack>

              {/*Sparkly*/}
              {/*<Flex*/}
              {/*  align="center"*/}
              {/*  direction="column"*/}
              {/*  flexShrink={0}*/}
              {/*  pr={{ md: 8 }}*/}
              {/*>*/}
              {/*  <ConstellationStar*/}
              {/*    w={{ base: "150px", md: "210px" }}*/}
              {/*    h={{ base: "150px", md: "210px" }}*/}
              {/*    label="Your smiling star companion"*/}
              {/*  />*/}
              {/*  <Text*/}
              {/*    fontSize="sm"*/}
              {/*    color="#52735E"*/}
              {/*    bg="white"*/}
              {/*    border="1px solid #E0E7D6"*/}
              {/*    borderRadius="full"*/}
              {/*    px={5}*/}
              {/*    py={2}*/}
              {/*  >*/}
              {/*    One memory at a time.*/}
              {/*  </Text>*/}
              {/*</Flex>*/}

            </Flex>

            <SimpleGrid
              columns={{ base: 1, md: 3 }}
              ref={storyStepsRef}
              spacing={{ base: 5, md: 6 }}
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
                  bg="white"
                  border="1px solid #E1E7D8"
                  borderRadius="26px"
                  boxShadow="0 5px 0 #E9EDDF"
                  data-revealed="false"
                  data-scroll-reveal="true"
                  key={step.index}
                  p={{ base: 6, md: 7 }}
                  spacing={4}
                >
                  <Flex align="center" color="#2E7A78" gap={3}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      ml="auto"
                      order={2}
                      color="#738976"
                    >
                      {step.index}
                    </Text>
                    <Flex
                      align="center"
                      bg={step.color}
                      boxSize="52px"
                      borderRadius="18px"
                      transform="rotate(-5deg)"
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
          as="section"
          bg="#EEF3E5"
          py={{ base: 16, md: 24 }}
          borderY="1px solid #E1E8D6"
        >
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            maxW="7xl"
            mx="auto"
            px={{ base: 5, md: 8 }}
            gap={{ base: 10, md: 16 }}
            alignItems="center"
          >
            <ConstellationPreview />
            <Stack spacing={5}>
              <Text color="#52735E" fontSize="sm" fontWeight="800">
                YOUR STORIES, CONNECTED
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "38px", md: "54px" }}
                lineHeight="1.08"
                sx={storybookHeading}
              >
                One memory leads to another.
              </Heading>
              <Text color="#617569" fontSize="lg" lineHeight="1.8">
                The kitchen reminds you of the garden. The garden brings back a
                summer. Each story becomes a star, and the connections you make
                become your own constellation.
              </Text>
              <Text color="#617569" lineHeight="1.8">
                Follow new questions inspired by the details you share. Revisit
                an old favorite, or wander down a path you haven’t explored yet.
              </Text>
              <HStack color="#426858" fontWeight="700" pt={2}>
                <Icon as={FiStar} />
                <Text>A map that grows with you.</Text>
              </HStack>
            </Stack>
          </SimpleGrid>
        </Box>

        <Box
          as="section"
          maxW="7xl"
          mx="auto"
          px={{ base: 5, md: 8 }}
          py={{ base: 16, md: 24 }}
        >
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            gap={{ base: 10, md: 16 }}
            alignItems="center"
          >
            <Stack spacing={5}>
              <Text color="#9A6927" fontSize="sm" fontWeight="800">
                LITTLE MOMENTS LEAD TO MILESTONES.
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "38px", md: "54px" }}
                lineHeight="1.08"
                sx={storybookHeading}
              >
                Keep remembering.
                <br />
                Keep leveling up.
              </Heading>
              <Text color="#617569" fontSize="lg" lineHeight="1.8">
                Every new story you save earns 25 XP. As your collection grows,
                you level up, reach new milestones, and see just how far you’ve
                come.
              </Text>
              <HStack spacing={3} align="start">
                <Icon as={FiSun} color="#A87930" mt={1} boxSize={5} />
                <Text color="#617569" lineHeight="1.8">
                  Save a story on consecutive days to build a streak. Or take
                  your time. Your memories will be waiting whenever you’re
                  ready.
                </Text>
              </HStack>
            </Stack>
            <Box
              bg="linear-gradient(135deg, #FFF5D8, #F8EDD8 60%, #F0E8EF)"
              border="1px solid #EADDC1"
              borderRadius="30px"
              p={{ base: 5, md: 8 }}
              boxShadow="0 6px 0 #E9DFC9"
            >
              <HStack align="center" spacing={{ base: 2, md: 4 }} mb={5}>
                <ConstellationStar
                  w={{ base: "104px", md: "140px" }}
                  h={{ base: "104px", md: "140px" }}
                />
                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color="#8A692E"
                    letterSpacing=".08em"
                  >
                    EVERY STORY COUNTS
                  </Text>
                  <Heading
                    as="h3"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    mt={2}
                    sx={storybookHeading}
                  >
                    Look at you glow.
                  </Heading>
                </Box>
              </HStack>
              <Box
                bg="rgba(255,255,255,.9)"
                p={{ base: 4, md: 6 }}
                borderRadius="22px"
                border="1px solid #E8E3D4"
              >
                <Flex justify="space-between" align="center" gap={2} mb={4}>
                  <HStack spacing={2}>
                    <Icon as={FiStar} color="#A77727" />
                    <Text fontWeight="800" fontSize="sm">
                      Level 1 · Stargazer
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="#617569">
                    Example progress
                  </Text>
                </Flex>
                <HStack
                  gap={2}
                  aria-label="Example: three of four stories saved toward the next level"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <Flex
                      key={i}
                      flex="1"
                      align="center"
                      justify="center"
                      h="42px"
                      bg={i < 3 ? "#DDECDD" : "#F5F3EA"}
                      color="#52735E"
                      borderRadius="12px"
                      border={
                        i < 3 ? "1px solid #C5DBC8" : "1px dashed #C7CEBF"
                      }
                    >
                      {i < 3 ? <FiCheck /> : <FiStar />}
                    </Flex>
                  ))}
                </HStack>
                <Text fontSize="sm" mt={3} color="#617569">
                  75 / 100 XP · One more story to level 2
                </Text>
              </Box>
              <Flex justify="space-between" gap={2} mt={5} flexWrap="wrap">
                {["✧ Stargazer", "✦ Story explorer", "✶ Memory keeper"].map(
                  (label) => (
                    <Text
                      key={label}
                      fontSize="xs"
                      fontWeight="700"
                      color="#7E6849"
                      py={1}
                    >
                      {label}
                    </Text>
                  ),
                )}
              </Flex>
            </Box>
          </SimpleGrid>
        </Box>

        <Box
          as="section"
          maxW="7xl"
          mx="auto"
          px={{ base: 5, md: 8 }}
          pb={{ base: 16, md: 24 }}
        >
          <Flex
            bg="#EEEAF3"
            border="1px solid #E0D9E8"
            borderRadius="30px"
            p={{ base: 6, md: 10 }}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 5, md: 8 }}
            align={{ base: "start", md: "center" }}
          >
            <Flex
              aria-hidden="true"
              boxSize={{ base: "64px", md: "100px" }}
              flexShrink={0}
              bg="#FAF8FD"
              border="2px solid white"
              boxShadow="0 5px 0 #DDD4E7"
              borderRadius="28px"
              align="center"
              justify="center"
              transform="rotate(-5deg)"
            >
              <Icon as={FiLock} boxSize={{ base: 7, md: 10 }} color="#7E6D94" />
            </Flex>
            <Stack spacing={3} maxW="750px">
              <Text color="#7E6D94" fontWeight="800" fontSize="sm">
                PERSONAL MEANS PERSONAL
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "32px", md: "44px" }}
                lineHeight="1.1"
                sx={storybookHeading}
              >
                Your constellation stays private.
                <br />
                Share only the stories you choose.
              </Heading>
              <Text
                color="#646071"
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="1.8"
              >
                Nothing is posted to a public feed, and other members can’t
                browse your collection. When a memory feels worth passing on,
                share that individual story with someone you love—without
                opening the rest of your constellation.
              </Text>
            </Stack>
          </Flex>
        </Box>

        <Box
          as="section"
          bg="#24483E"
          color="#FFF8E8"
          py={{ base: 16, md: 20 }}
          position="relative"
          overflow="hidden"
          textAlign="center"
        >
          <Box
            aria-hidden="true"
            position="absolute"
            inset={0}
            opacity={0.15}
            bgImage="radial-gradient(#F4D58A 1px, transparent 1px)"
            bgSize="38px 38px"
          />
          <Stack
            maxW="750px"
            mx="auto"
            px={{ base: 5, md: 8 }}
            spacing={5}
            align="center"
            position="relative"
          >
            <Icon as={FiStar} boxSize={8} color="#F4D58A" />
            <Heading
              as="h2"
              fontSize={{ base: "40px", md: "60px" }}
              lineHeight="1.05"
              sx={storybookHeading}
            >
              There’s a whole sky
              <br />
              of stories in you.
            </Heading>
            <Text color="#D6E2D4" fontSize="lg" lineHeight="1.7">
              Let’s find the first one.
            </Text>
            <Button
              as={Link}
              rightIcon={<FiArrowRight />}
              size="lg"
              to="/signup"
              variant="accent"
              mt={2}
            >
              Begin your constellation
            </Button>
            <HStack color="#D6E2D4" spacing={2} fontSize="sm">
              <Icon as={FiLock} />
              <Text>Private by default. Shared story by story.</Text>
            </HStack>
          </Stack>
        </Box>
      </Box>

      <Flex
        align="center"
        bg="#1B3B32"
        color="rgba(255, 248, 232, 0.7)"
        direction={{ base: "column", sm: "row" }}
        gap={2}
        justify="space-between"
        px={{ base: 5, md: 8 }}
        py={5}
      >
        <Text fontSize="sm">MemriPlace. Stories worth keeping.</Text>
        <HStack spacing={{ base: 4, md: 5 }} flexWrap="wrap" justify="center">
          <Button
            color="inherit"
            fontSize="sm"
            fontWeight="500"
            minW="auto"
            onClick={() => setFooterModal("contact")}
            p={0}
            textDecoration="underline"
            textUnderlineOffset="3px"
            variant="link"
          >
            Contact us
          </Button>
          <Button
            color="inherit"
            fontSize="sm"
            fontWeight="500"
            minW="auto"
            onClick={() => setFooterModal("legal")}
            p={0}
            textDecoration="underline"
            textUnderlineOffset="3px"
            variant="link"
          >
            Privacy & terms
          </Button>
          <Text fontSize="sm">© {new Date().getFullYear()}</Text>
        </HStack>
      </Flex>
      <Modal isCentered isOpen={footerModal === "contact"} onClose={() => setFooterModal(null)}>
        <ModalOverlay bg="rgba(3, 19, 24, 0.72)" backdropFilter="blur(8px)" />
        <ModalContent bg="#FFFDF7" borderRadius="24px" mx={4}>
          <ModalHeader color="#24483E" fontFamily="Georgia, serif" pt={7}>
            Contact us
          </ModalHeader>
          <ModalCloseButton color="#526A70" top={5} />
          <ModalBody color="#526A70" lineHeight="1.75" pb={7}>
            <Text>
              Questions, ideas, or a story about how MemriPlace is working for you?
              We’d love to hear from you.
            </Text>
            <Button
              as="a"
              colorScheme="teal"
              href="mailto:Lenehan3@gmail.com"
              mt={5}
              variant="outline"
            >
              Lenehan3@gmail.com
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isCentered isOpen={footerModal === "legal"} onClose={() => setFooterModal(null)} size={{ base: "sm", md: "lg" }}>
        <ModalOverlay bg="rgba(3, 19, 24, 0.72)" backdropFilter="blur(8px)" />
        <ModalContent bg="#FFFDF7" borderRadius="24px" mx={4}>
          <ModalHeader color="#24483E" fontFamily="Georgia, serif" pt={7}>
            Privacy & terms
          </ModalHeader>
          <ModalCloseButton color="#526A70" top={5} />
          <ModalBody color="#526A70" lineHeight="1.75" pb={7}>
            <Stack spacing={5}>
              <Box>
                <Heading as="h3" color="#24483E" fontSize="lg" mb={2} sx={storybookHeading}>
                  Your privacy
                </Heading>
                <Text>
                  Your stories are private by default and are not shown in a public feed.
                  You choose whether to share an individual story. We use your account and
                  story information to provide MemriPlace and keep your constellation available to you.
                </Text>
              </Box>
              <Box>
                <Heading as="h3" color="#24483E" fontSize="lg" mb={2} sx={storybookHeading}>
                  Terms of use
                </Heading>
                <Text>
                  Please use MemriPlace responsibly and only share stories you have the right to share.
                  The service is designed to help you preserve memories; it does not replace professional,
                  legal, medical, or emergency support.
                </Text>
              </Box>
              <Text fontSize="sm">
                Questions about privacy or these terms? Email {" "}
                <Button
                  as="a"
                  color="#2E7A78"
                  fontSize="inherit"
                  fontWeight="600"
                  href="mailto:Lenehan3@gmail.com"
                  minW="auto"
                  p={0}
                  textDecoration="underline"
                  textUnderlineOffset="3px"
                  variant="link"
                >
                  Lenehan3@gmail.com
                </Button>
                .
              </Text>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
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
