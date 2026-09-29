import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { FiArrowRight, FiCheck, FiLink, FiStar, FiX } from "react-icons/fi"
import type { RelatedStorySuggestion, StorySummaryPublic } from "../../client"

type Satellite = {
  story: StorySummaryPublic
  status: "connected" | "proposed"
}

type Props = {
  currentStory?: StorySummaryPublic
  connected: StorySummaryPublic[]
  suggestions: RelatedStorySuggestion[]
  hiddenConnectionCount: number
  connectingId?: number
  disconnectingId?: number
  recentlyConnectedId: number | null
  onConnect: (id: number) => void
  onDisconnect: (id: number) => void
  onDismiss: (id: number) => void
}

const positions = [
  { x: 24, y: 22 },
  { x: 76, y: 76 },
  { x: 76, y: 20 },
  { x: 24, y: 79 },
]

const colors = ["#B9DDCF", "#E6D9EF", "#F1D5BA", "#C7DFE9"]

export default function ConnectionConstellation({
  currentStory,
  connected,
  suggestions,
  hiddenConnectionCount,
  connectingId,
  disconnectingId,
  recentlyConnectedId,
  onConnect,
  onDisconnect,
  onDismiss,
}: Props) {
  const reduceMotion = useReducedMotion()
  const satellites: Satellite[] = [
    ...connected.map((story): Satellite => ({ story, status: "connected" })),
    ...suggestions.map(({ story }): Satellite => ({ story, status: "proposed" })),
  ].sort((a, b) => a.story.id - b.story.id).slice(0, positions.length)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const visibleIds = satellites.map(({ story }) => story.id).join(",")

  useEffect(() => {
    if (satellites.some(({ story }) => story.id === selectedId)) return
    setSelectedId(satellites.find(({ status }) => status === "proposed")?.story.id ?? satellites[0]?.story.id ?? null)
  }, [selectedId, visibleIds])

  const selected = satellites.find(({ story }) => story.id === selectedId)
  const currentTitle = currentStory?.title || "This memory"

  return (
    <Box
      bg="#F8FAEF"
      border="1px solid #DFE6D7"
      borderRadius="28px"
      boxShadow="0 6px 0 #E6EBD9"
      overflow="hidden"
    >
      <Flex
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap={3}
        justify="space-between"
        px={{ base: 4, md: 6 }}
        pt={5}
      >
        <Box>
          <Text color="#52775C" fontSize="xs" fontWeight="800" letterSpacing=".12em">
            YOUR NIGHT SKY IS GROWING
          </Text>
          <Heading color="#23483F" fontSize={{ base: "xl", md: "2xl" }} mt={1}>
            Follow the threads of your story
          </Heading>
          <Text color="#61777A" fontSize="sm" mt={2}>
            Dotted paths are possibilities. Choose the ones that feel true.
          </Text>
        </Box>
        <HStack align="center" color="#547860" flexShrink={0} fontSize="xs" spacing={4}>
          <HStack spacing={2}><Box borderTop="2px dashed #B48C53" w={5} /><Text>Possible</Text></HStack>
          <HStack spacing={2}><Box borderTop="3px solid #5C9C82" w={5} /><Text>Connected</Text></HStack>
        </HStack>
      </Flex>

      <Box
        aria-label="Nearby memories in your night sky"
        bg="#F8FAEF"
        backgroundImage="radial-gradient(#C5D4BC 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(255,238,177,.55), transparent 27%), radial-gradient(circle at 80% 12%, rgba(190,221,207,.3), transparent 28%)"
        backgroundSize="28px 28px"
        h={{ base: "390px", md: "410px" }}
        mt={3}
        position="relative"
      >
        <svg
          aria-hidden="true"
          height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
          viewBox="0 0 100 100"
          width="100%"
        >
          {satellites.map(({ story, status }, index) => {
            const point = positions[index]
            const justConnected = story.id === recentlyConnectedId && status === "connected"
            if (status === "proposed") {
              return (
                <line
                  key={story.id}
                  stroke="#B48C53"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                  x1="50"
                  x2={point.x}
                  y1="50"
                  y2={point.y}
                />
              )
            }
            return (
              <motion.line
                key={story.id}
                animate={{ opacity: 1, pathLength: 1 }}
                initial={justConnected && !reduceMotion ? { opacity: 0.35, pathLength: 0 } : false}
                transition={{ duration: 0.75, ease: "easeOut" }}
                stroke="#5C9C82"
                strokeLinecap="round"
                strokeWidth={3.5}
                vectorEffect="non-scaling-stroke"
                x1="50"
                x2={point.x}
                y1="50"
                y2={point.y}
              />
            )
          })}
        </svg>

        <Box left="50%" position="absolute" top="50%" transform="translate(-50%, -50%)" zIndex={2}>
          <motion.div
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            initial={reduceMotion ? false : { opacity: 0, rotate: -12, scale: 0.65 }}
            transition={{ type: "spring", stiffness: 280, damping: 16 }}
          >
            <Flex
              align="center"
              aria-label={`This star: ${currentTitle}`}
              bg="#F7D784"
              border="4px solid white"
              borderRadius="30px"
              boxShadow="0 0 0 4px #E8BA62, 0 9px 0 #D4DDBF, 0 0 32px rgba(245,202,113,.52)"
              h={{ base: "78px", md: "88px" }}
              justify="center"
              role="img"
              transform="rotate(-5deg)"
              w={{ base: "78px", md: "88px" }}
            >
              <Icon as={FiStar} boxSize={9} color="#496B56" fill="rgba(255,255,255,.65)" />
            </Flex>
          </motion.div>
          <Text
            bg="rgba(248,250,239,.96)"
            borderRadius="lg"
            color="#335647"
            fontSize="sm"
            fontWeight="800"
            left="50%"
            mt={3}
            noOfLines={2}
            position="absolute"
            textAlign="center"
            transform="translateX(-50%)"
            w={{ base: "142px", md: "200px" }}
          >
            {currentTitle}
          </Text>
        </Box>

        {satellites.map(({ story, status }, index) => {
          const point = positions[index]
          const active = selected?.story.id === story.id
          const justConnected = story.id === recentlyConnectedId && status === "connected"
          return (
            <Box
              key={story.id}
              left={`${point.x}%`}
              position="absolute"
              top={`${point.y}%`}
              transform="translate(-50%, -50%)"
              zIndex={2}
            >
              <motion.div
                animate={justConnected && !reduceMotion ? { opacity: 1, scale: [1, 1.22, 1] } : { opacity: 1, scale: 1 }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: reduceMotion ? 0 : index * 0.08 }}
              >
                <Button
                  aria-label={`${status === "proposed" ? "Possible connection" : "Connected memory"}: ${story.title || "A remembered moment"}`}
                  aria-pressed={active}
                  bg={status === "connected" ? colors[index % colors.length] : "#FFF1D0"}
                  border={status === "connected" ? "3px solid white" : "3px dashed #C7A56A"}
                  borderRadius="24px"
                  boxShadow={active ? "0 0 0 3px #6B9375, 0 7px 0 #C2CFB8" : "0 5px 0 #D2DBC5"}
                  color="#426454"
                  h={{ base: "62px", md: "72px" }}
                  onClick={() => setSelectedId(story.id)}
                  transform={`rotate(${index % 2 ? 6 : -6}deg)`}
                  variant="unstyled"
                  w={{ base: "62px", md: "72px" }}
                  _hover={{ filter: "brightness(1.04)", transform: "rotate(0deg) translateY(-3px)" }}
                >
                  <Icon as={status === "connected" ? FiCheck : FiStar} boxSize={7} />
                </Button>
              </motion.div>
              <Text
                bg="rgba(248,250,239,.96)"
                borderRadius="lg"
                color="#335647"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="800"
                left="50%"
                mt={2}
                noOfLines={2}
                position="absolute"
                textAlign="center"
                transform="translateX(-50%)"
                w={{ base: "130px", md: "180px" }}
              >
                {story.title || "A remembered moment"}
              </Text>
            </Box>
          )
        })}
      </Box>

      <Box bg="white" borderTop="1px solid #E0E7D9" p={{ base: 4, md: 6 }}>
        {selected ? (
          <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} justify="space-between">
            <Stack flex="1" minW={0} spacing={2}>
              <HStack color={selected.status === "connected" ? "#4B8D82" : "#A87A31"} fontSize="xs" fontWeight="800" spacing={2}>
                <Icon as={selected.status === "connected" ? FiCheck : FiStar} />
                <Text>{selected.status === "connected" ? "CONNECTED MEMORY" : "POSSIBLE CONNECTION"}</Text>
              </HStack>
              <Heading color="#23483F" fontSize="lg" noOfLines={2}>
                {selected.story.title || "A remembered moment"}
              </Heading>
              <Text color="#61777A" fontSize="sm" noOfLines={2}>
                {selected.story.summary_text}
              </Text>
            </Stack>
            {selected.status === "proposed" ? (
              <HStack flexShrink={0} spacing={2}>
                <Button
                  isLoading={connectingId === selected.story.id}
                  leftIcon={<FiLink />}
                  onClick={() => onConnect(selected.story.id)}
                  size="sm"
                  variant="accent"
                >
                  Make this connection
                </Button>
                <Button aria-label="Dismiss this suggestion" onClick={() => onDismiss(selected.story.id)} size="sm" variant="ghost">
                  <FiX />
                </Button>
              </HStack>
            ) : (
              <HStack flexShrink={0} spacing={2}>
                <Button as={Link} rightIcon={<FiArrowRight />} size="sm" to="/summary/$summaryId" params={{ summaryId: String(selected.story.id) }} variant="secondary">
                  Revisit memory
                </Button>
                <Button
                  aria-label={`Disconnect ${selected.story.title || "memory"}`}
                  isLoading={disconnectingId === selected.story.id}
                  onClick={() => onDisconnect(selected.story.id)}
                  size="sm"
                  title="Remove connection"
                  variant="ghost"
                >
                  <FiX />
                </Button>
              </HStack>
            )}
          </Flex>
        ) : (
          <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} justify="space-between">
            <Box>
              <Heading color="#23483F" fontSize="lg">One star can start a whole sky.</Heading>
              <Text color="#61777A" fontSize="sm" mt={2}>Save more memories and new paths will appear here.</Text>
            </Box>
            <Button as={Link} rightIcon={<FiArrowRight />} size="sm" to="/conversations" variant="secondary">
              Explore your night sky
            </Button>
          </Flex>
        )}
        {(hiddenConnectionCount > 0 || satellites.length > 0) && (
          <Flex align="center" color="#61777A" fontSize="xs" justify="space-between" mt={4} gap={3} flexWrap="wrap">
            <Text>{hiddenConnectionCount > 0 ? `+${hiddenConnectionCount} more saved ${hiddenConnectionCount === 1 ? "connection" : "connections"} in your night sky` : "Every connection is your choice."}</Text>
            <Button as={Link} color="#356D63" fontSize="xs" minW="auto" p={0} rightIcon={<FiArrowRight />} to="/conversations" variant="link">
              View my night sky
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
