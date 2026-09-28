import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"
import { useState } from "react"
import { FiArrowRight, FiStar } from "react-icons/fi"
import type { StoryRelationshipPublic, StorySummaryPublic } from "../../client"

const colors = ["#F5D785", "#B9DDCF", "#D8C9E6", "#F2C6AE", "#C1DBE8"]
export default function ConstellationMap({
  stories,
  relationships,
}: {
  stories: StorySummaryPublic[]
  relationships: StoryRelationshipPublic[]
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const columns = useBreakpointValue({ base: 2, md: 4 }) ?? 2
  const reduce = useReducedMotion()
  const selected = stories.find((s) => s.id === selectedId) ?? stories[0]
  const ordered = [...stories].sort((a, b) => a.id - b.id)
  const height = Math.max(330, Math.ceil(ordered.length / columns) * 160 + 60)
  const position = new Map(
    ordered.map((s, i) => [
      s.id,
      {
        x: (((i % columns) + 0.5) / columns) * 100,
        y: 80 + Math.floor(i / columns) * 160 + (i % 2) * 28,
      },
    ]),
  )
  const connectionCount = relationships.filter(
    (r) => r.story_a_id === selected?.id || r.story_b_id === selected?.id,
  ).length
  return (
    <Box
      border="1px solid #DFE6D7"
      borderRadius="28px"
      overflow="hidden"
      bg="#F8FAEF"
      boxShadow="0 5px 0 #E6EBD9"
    >
      <Flex
        px={{ base: 4, md: 6 }}
        pt={5}
        justify="space-between"
        gap={3}
        align="center"
      >
        <Box>
          <Text
            fontSize="xs"
            fontWeight="800"
            color="#52775C"
            letterSpacing=".1em"
            textTransform="uppercase"
          >
            A sky only you could make
          </Text>
          <Text color="ui.muted" fontSize="sm" mt={1}>
            Tap a star to rediscover its story.
          </Text>
        </Box>
        <Text fontSize="xs" color="#52775C" whiteSpace="nowrap">
          {stories.length} stars
        </Text>
      </Flex>
      <Box
        maxH="530px"
        overflowY="auto"
        tabIndex={0}
        aria-label="Constellation of saved memories. Scroll to explore all stars."
        sx={{ scrollbarWidth: "thin" }}
      >
        <Box
          position="relative"
          h={`${height}px`}
          minW="260px"
          backgroundImage="radial-gradient(#C5D4BC 1px, transparent 1px)"
          backgroundSize="28px 28px"
          mt={3}
        >
          <svg
            aria-hidden="true"
            width="100%"
            height={height}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {relationships.map((r) => {
              const a = position.get(r.story_a_id),
                b = position.get(r.story_b_id)
              if (!a || !b) return null
              const active =
                r.story_a_id === selected?.id || r.story_b_id === selected?.id
              return (
                <line
                  key={r.id}
                  x1={`${a.x}%`}
                  y1={a.y}
                  x2={`${b.x}%`}
                  y2={b.y}
                  stroke={active ? "#68967A" : "#C1D1BA"}
                  strokeWidth={active ? 3.5 : 2.5}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
          {ordered.map((story, i) => {
            const point = position.get(story.id)!
            const active = selected?.id === story.id
            return (
              <Box
                key={story.id}
                position="absolute"
                left={`${point.x}%`}
                top={`${point.y - 36}px`}
                transform="translateX(-50%)"
                w={{ base: "132px", md: "168px" }}
                textAlign="center"
              >
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(i * 0.04, 0.4),
                  }}
                >
                  <Button
                    onClick={() => setSelectedId(story.id)}
                    aria-label={`Explore ${
                      story.title || "a remembered moment"
                    }`}
                    aria-pressed={active}
                    variant="unstyled"
                    display="inline-flex"
                    justifyContent="center"
                    alignItems="center"
                    boxSize="72px"
                    borderRadius="24px"
                    bg={colors[i % colors.length]}
                    border="3px solid white"
                    boxShadow={
                      active
                        ? "0 0 0 3px #6B9375, 0 7px 0 #C2CFB8"
                        : "0 5px 0 #CCD5BC"
                    }
                    transform={`rotate(${i % 2 ? 7 : -7}deg)`}
                    _hover={{
                      filter: "brightness(1.04)",
                      transform: "rotate(0deg) translateY(-3px)",
                    }}
                  >
                    <Icon
                      as={FiStar}
                      fill="rgba(255,255,255,.65)"
                      color="#426454"
                      boxSize={7}
                    />
                  </Button>
                  <Text
                    mt={3}
                    fontWeight="800"
                    color="#335647"
                    fontSize="sm"
                    noOfLines={2}
                    bg="rgba(248,250,239,.93)"
                    borderRadius="lg"
                    px={1}
                  >
                    {story.title || "A remembered moment"}
                  </Text>
                </motion.div>
              </Box>
            )
          })}
        </Box>
      </Box>
      {selected && (
        <Flex
          gap={4}
          p={{ base: 4, md: 6 }}
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          bg="white"
          borderTop="1px solid #E0E7D9"
        >
          <Box flex="1" minW={0}>
            <HStack mb={1}>
              <Icon as={FiStar} color="#A87A31" />
              <Text fontSize="xs" color="ui.muted">
                {connectionCount
                  ? `${connectionCount} connected ${
                      connectionCount === 1 ? "memory" : "memories"
                    }`
                  : "A little piece of your universe"}
              </Text>
            </HStack>
            <Heading fontSize="xl">
              {selected.title || "A remembered moment"}
            </Heading>
            <Text color="ui.muted" noOfLines={2} fontSize="sm" mt={2}>
              {selected.summary_text}
            </Text>
          </Box>
          <Button
            as={Link}
            to="/summary/$summaryId"
            params={{ summaryId: String(selected.id) }}
            variant="secondary"
            rightIcon={<FiArrowRight />}
            flexShrink={0}
          >
            Revisit memory
          </Button>
        </Flex>
      )}
    </Box>
  )
}
