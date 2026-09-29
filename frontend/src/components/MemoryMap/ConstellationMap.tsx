import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"
import { useState } from "react"
import { FiArrowRight, FiLink, FiPlus, FiStar } from "react-icons/fi"
import { SummariesService, type StoryRelationshipPublic, type StorySummaryPublic } from "../../client"
import { celebrateConnection } from "../../lib/celebration"
import { nightSkyApi, type Constellation } from "../../lib/nightSkyApi"

const colors = ["#F5D785", "#B9DDCF", "#D8C9E6", "#F2C6AE", "#C1DBE8"]
const groupColors = ["#F7D987", "#B9DDCF", "#D8C9E6", "#F2C6AE"]
export default function ConstellationMap({
  stories,
  relationships,
  groups = [],
}: {
  stories: StorySummaryPublic[]
  relationships: StoryRelationshipPublic[]
  groups?: Constellation[]
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")
  const [dismissed, setDismissed] = useState<number[]>([])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const suggestions = useQuery({
    queryKey: ["skySuggestions", selected?.id],
    queryFn: () => SummariesService.readRelatedStories({ id: selected!.id, limit: 5 }),
    enabled: !!selected && !creating && stories.length > 1,
    staleTime: 5 * 60 * 1000,
  })
  const linkedIds = new Set(relationships.flatMap((link) =>
    link.story_a_id === selected?.id ? [link.story_b_id] : link.story_b_id === selected?.id ? [link.story_a_id] : [],
  ))
  const proposed = (suggestions.data ?? []).filter(({ story }) =>
    position.has(story.id) && !linkedIds.has(story.id) && !dismissed.includes(story.id),
  ).slice(0, 2)
  const connect = useMutation({
    mutationFn: (otherId: number) => SummariesService.createStoryRelationship({ id: selected!.id, otherId }),
    onSuccess: async (_relationship, otherId) => {
      celebrateConnection()
      setPicked([selected!.id, otherId])
      setCreating(true)
      await queryClient.invalidateQueries({ queryKey: ["storyRelationships"] })
    },
  })
  const create = useMutation({
    mutationFn: () => nightSkyApi.create({
      title: name.trim(), overview: "",
      members: picked.map((story_id) => ({ story_id, x: null, y: null, share_story: false, share_image: false })),
      links: picked.slice(1).map((story_b_id, i) => ({ story_a_id: picked[i], story_b_id })),
    }),
    onSuccess: async (group) => {
      celebrateConnection()
      setNaming(false)
      setCreating(false)
      setPicked([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
      ])
      await navigate({ to: "/constellation/$constellationId", params: { constellationId: String(group.id) } })
    },
  })
  const toggleStory = (storyId: number) => {
    if (creating) setPicked((current) => current.includes(storyId) ? current.filter((id) => id !== storyId) : [...current, storyId])
    else setSelectedId(storyId)
  }
  return (
    <Box
      border="1px solid #3B6570"
      borderRadius="28px"
      overflow="hidden"
      bg="#102F3C"
      boxShadow="0 12px 35px rgba(11,45,53,.14)"
    >
      <Flex
        px={{ base: 4, md: 6 }}
        py={5}
        justify="space-between"
        gap={3}
        align="center"
      >
        <Box>
          <Text
            fontSize="xs"
            fontWeight="800"
            color="#F7D57D"
            letterSpacing=".1em"
            textTransform="uppercase"
          >
            A sky only you could make
          </Text>
          <Text color="#E0EDE7" fontSize="sm" mt={1}>
            {creating ? `${picked.length} selected · tap stars to make a shape` : "Tap a star to rediscover its story."}
          </Text>
        </Box>
        {creating ? <HStack>
          <Button size="sm" variant="ghost" color="white" onClick={() => { setCreating(false); setPicked([]) }}>Cancel</Button>
          <Button size="sm" onClick={() => setNaming(true)} isDisabled={picked.length < 2} bg="#F5D785" color="#1B4141">Create constellation</Button>
        </HStack> : <Button size="sm" leftIcon={<FiPlus />} onClick={() => setCreating(true)} isDisabled={stories.length < 2}
          bg="#F5D785" color="#1B4141" _hover={{ bg: "#FFE19A" }}>Connect your stars</Button>}
      </Flex>
      <Box
        maxH="530px"
        overflowY="auto"
        tabIndex={0}
        aria-label="Your private night sky. Scroll to explore all stars."
        sx={{ scrollbarWidth: "thin" }}
      >
        <Box
          position="relative"
          h={`${height}px`}
          minW="260px"
          backgroundColor="#102F3C"
          backgroundImage="radial-gradient(#6E9B95 1px, transparent 1px), radial-gradient(circle at 50% 10%, #254E5A, #102F3C 65%)"
          backgroundSize="28px 28px"
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
              const groupIndex = groups.findIndex((group) => group.links.some((link) =>
                link.story_a_id === r.story_a_id && link.story_b_id === r.story_b_id,
              ))
              return (
                <line
                  key={r.id}
                  x1={`${a.x}%`}
                  y1={a.y}
                  x2={`${b.x}%`}
                  y2={b.y}
                  stroke={groupIndex >= 0 ? groupColors[groupIndex % groupColors.length] : active ? "#91C7AF" : "#709991"}
                  strokeWidth={groupIndex >= 0 ? 4 : active ? 3.5 : 2.5}
                  strokeLinecap="round"
                />
              )
            })}
            {!creating && selected && proposed.map(({ story }) => {
              const a = position.get(selected.id)
              const b = position.get(story.id)
              return a && b ? <line key={`suggested-${story.id}`} x1={`${a.x}%`} y1={a.y} x2={`${b.x}%`} y2={b.y}
                stroke="#F7D987" strokeWidth={2.5} strokeDasharray="4 10" strokeLinecap="round" /> : null
            })}
            {creating && picked.slice(1).map((id, i) => {
              const a = position.get(picked[i])
              const b = position.get(id)
              return a && b ? <line key={`draft-${id}`} x1={`${a.x}%`} y1={a.y} x2={`${b.x}%`} y2={b.y}
                stroke="#F7D987" strokeWidth={3} strokeDasharray="5 8" strokeLinecap="round" /> : null
            })}
          </svg>
          {ordered.map((story, i) => {
            const point = position.get(story.id)!
            const active = creating ? picked.includes(story.id) : selected?.id === story.id
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
                    onClick={() => toggleStory(story.id)}
                    aria-label={`${creating ? "Select" : "Explore"} ${
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
                        ? "0 0 0 4px #F7D987, 0 0 24px #F7D98799"
                        : "0 0 17px #F7D98755"
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
                    color="#FFF9E8"
                    fontSize="sm"
                    noOfLines={2}
                    bg="rgba(12,42,54,.83)"
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
      {creating && <Flex p={{ base: 4, md: 6 }} bg="#FFFDF5" align="center" justify="space-between" gap={4} flexWrap="wrap">
        <Box><Heading size="sm">Shape your constellation</Heading><Text color="ui.muted" fontSize="sm" mt={1}>Choose at least two memories. Your constellation stays private until you decide to publish it.</Text></Box>
        <Button onClick={() => setNaming(true)} variant="accent" isDisabled={picked.length < 2}>Create constellation</Button>
      </Flex>}
      {!creating && selected && (
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
            {proposed.length > 0 && <Box mt={4}>
              <Text color="#63816C" fontSize="xs" fontWeight="800" textTransform="uppercase" mb={2}>Possible connections · dotted lines</Text>
              {proposed.map(({ story }) => <Flex key={story.id} align="center" justify="space-between" gap={2} bg="#F2F7ED" borderRadius="lg" px={3} py={2} mb={2}>
                <Text fontSize="sm" fontWeight="700" noOfLines={1}>{story.title || "Another memory"}</Text>
                <HStack><Button size="xs" variant="ghost" onClick={() => setDismissed((items) => [...items, story.id])}>Dismiss</Button>
                  <Button size="xs" leftIcon={<FiLink />} onClick={() => connect.mutate(story.id)} isLoading={connect.isPending}>Connect</Button></HStack>
              </Flex>)}
            </Box>}
            {suggestions.isError && <Text color="ui.muted" fontSize="xs" mt={2}>Suggestions are unavailable. You can still choose stars yourself.</Text>}
            {connect.isError && <Text color="red.600" role="alert" mt={2}>Couldn’t save the connection. Try again.</Text>}
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
      {groups.length > 0 && <Box bg="#FFFDF5" borderTop="1px solid #E0E7D9" px={{ base: 4, md: 6 }} py={5}>
        <Text color="#63816C" fontSize="xs" fontWeight="800" textTransform="uppercase" mb={3}>Your constellations</Text>
        <Flex gap={2} flexWrap="wrap">
          {groups.map((group, index) => <Button key={group.id} as={Link} to="/constellation/$constellationId" params={{ constellationId: String(group.id) }}
            size="sm" borderRadius="full" leftIcon={<FiStar />} bg={groupColors[index % groupColors.length]} color="#275C52" _hover={{ filter: "brightness(1.05)" }}>
            {group.title} · {group.members.length} stars
          </Button>)}
        </Flex>
      </Box>}
      <Modal isOpen={naming} onClose={() => setNaming(false)} isCentered>
        <ModalOverlay /><ModalContent borderRadius="24px"><ModalHeader>Name your constellation</ModalHeader><ModalCloseButton />
          <ModalBody><Text color="ui.muted" mb={4}>These {picked.length} memories will become a private constellation. You can edit its overview next.</Text>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="A name that brings these moments together" maxLength={120} autoFocus />
            {create.isError && <Text color="red.600" role="alert" mt={3}>{String(create.error)}</Text>}
          </ModalBody><ModalFooter gap={2}><Button variant="ghost" onClick={() => setNaming(false)}>Back</Button>
            <Button variant="accent" onClick={() => create.mutate()} isLoading={create.isPending} isDisabled={!name.trim()}>Save constellation</Button>
          </ModalFooter></ModalContent>
      </Modal>
    </Box>
  )
}
