import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMemo, useRef, useState } from "react"
import {
  FiArrowRight,
  FiBookOpen,
  FiGitBranch,
  FiPlus,
  FiStar,
} from "react-icons/fi"

import {
  ConversationsService,
  SummariesService,
  type ConversationPublic,
  type StoryRelationshipPublic,
  type StorySummaryPublic,
} from "../../client"
import ProgressTrail from "../../components/Progress/ProgressTrail"
import ConstellationMap from "../../components/MemoryMap/ConstellationMap"
import ConstellationStar from "../../components/Common/ConstellationStar"
import { nightSkyApi } from "../../lib/nightSkyApi"

export const Route = createFileRoute("/_layout/conversations")({
  component: MemoryMap,
})

const ink = "#17353B"
const muted = "#61777A"
const paper = "#FFFDF5"
const accents = ["#D88B4A", "#4B8D82", "#9A78AA", "#CE7667", "#638CAA"]

function MemoryMap() {
  const [view, setView] = useState<"sky" | "cards">("sky")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startRequestInFlight = useRef(false)
  const conversationsQuery = useQuery({
    queryKey: ["conversationConstellation"],
    queryFn: () => ConversationsService.readConversations({ limit: 500 }),
  })
  const storiesQuery = useQuery({
    queryKey: ["summaries"],
    queryFn: () => SummariesService.readStorySummaries({ limit: 100 }),
  })
  const relationshipsQuery = useQuery({
    queryKey: ["storyRelationships"],
    queryFn: () => SummariesService.readStoryRelationships(),
    enabled: storiesQuery.isSuccess,
  })
  const groupsQuery = useQuery({
    queryKey: ["constellations"],
    queryFn: nightSkyApi.list,
    enabled: storiesQuery.isSuccess,
  })
  const createConversation = useMutation({
    mutationFn: () =>
      ConversationsService.createConversation({ requestBody: {} }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({
        queryKey: ["conversationConstellation"],
      })
      await navigate({
        to: "/conversation/$conversationId",
        params: { conversationId: String(conversation.id) },
      })
    },
    onSettled: () => {
      startRequestInFlight.current = false
    },
  })

  const stories = useMemo(
    () =>
      [...(storiesQuery.data ?? [])].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
    [storiesQuery.data],
  )
  const relationships = relationshipsQuery.data ?? []
  const storyById = useMemo(
    () => new Map(stories.map((story) => [story.id, story])),
    [stories],
  )
  const storyConversationIds = useMemo(
    () => new Set(stories.map((story) => story.conversation_id)),
    [stories],
  )
  const inProgress = useMemo(
    () =>
      (conversationsQuery.data?.data ?? [])
        .filter((node) => {
          const isOpen =
            node.status === "active" ||
            node.status === "ready_for_summary" ||
            node.status === "inactive"
          return isOpen && !storyConversationIds.has(node.id)
        })
        .sort((a, b) => Number(a.status === "inactive") - Number(b.status === "inactive") || b.created_at.localeCompare(a.created_at)),
    [conversationsQuery.data, storyConversationIds],
  )

  const isLoading = conversationsQuery.isLoading || storiesQuery.isLoading
  const hasError = conversationsQuery.isError || storiesQuery.isError

  const startStory = () => {
    if (startRequestInFlight.current) return
    startRequestInFlight.current = true
    createConversation.mutate()
  }

  if (isLoading) {
    return (
      <Center minH="60vh" flexDirection="column" gap={4} color={muted}>
        <Spinner color="#4B8D82" size="xl" thickness="3px" />
        <Text>Gathering your memories…</Text>
      </Center>
    )
  }

  return (
    <Box color={ink} maxW="1280px" mx="auto" pb={{ base: 12, md: 20 }}>
      <Flex
        align={{ base: "stretch", md: "flex-end" }}
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap={5}
        mb={8}
      >
        <Box maxW="650px">
          <HStack spacing={2} color="#4B8D82" mb={3}>
            <Icon as={FiGitBranch} />
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="0.13em"
              textTransform="uppercase"
            >
              Your personal night sky
            </Text>
          </HStack>
          <Heading
            fontFamily={
              '"Iowan Old Style", "Palatino Linotype", Georgia, serif'
            }
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1.08"
          >
            Your sky, one story at a time.
          </Heading>
          <Text
            color={muted}
            mt={3}
            fontSize={{ base: "md", md: "lg" }}
            lineHeight="1.7"
          >
            Every memory adds a little light. Follow a thread and see where it
            takes you.
          </Text>
        </Box>
        <ConstellationStar
          h="120px"
          w="120px"
          display={{ base: "none", md: "block" }}
        />
      </Flex>
      <ProgressTrail />
      {stories.length > 0 && (
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          mb={7}
          p={5}
          bg="#EDF4E7"
          borderRadius="22px"
          flexWrap="wrap"
        >
          <Box>
            <Text
              fontSize="xs"
              color="#53755E"
              fontWeight="800"
              letterSpacing=".08em"
            >
              YOUR NEXT LITTLE ADVENTURE
            </Text>
            <Heading size="md" mt={1}>
              {inProgress.length
                ? "There’s more to this story."
                : "Make room for another memory."}
            </Heading>
            <Text fontSize="sm" color={muted} mt={1}>
              A few moments today. A story to keep forever.
            </Text>
          </Box>
          {inProgress.length === 0 && (
            <Button
              variant="accent"
              size="lg"
              rightIcon={<FiPlus />}
              onClick={startStory}
              isLoading={createConversation.isPending}
            >
              Add a memory
            </Button>
          )}
          {inProgress.length > 0 && (
            <ContinueStory node={inProgress[0]} primary />
          )}
        </Flex>
      )}

      {hasError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t load part of your memory map. Refresh the page to try
          again.
        </Alert>
      )}
      {createConversation.isError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t start a story just now. Please try again.
        </Alert>
      )}

      {(inProgress.length > 1 ||
        (inProgress.length > 0 && stories.length === 0)) && (
        <Box mb={10}>
          <Flex align="center" gap={2} mb={4}>
            <Icon as={FiBookOpen} color="#4B8D82" />
            <Heading size="md">Paths to explore</Heading>
          </Flex>
          <Stack spacing={3}>
            {inProgress.slice(stories.length > 0 ? 1 : 0).map((node, index) => (
              <ContinueStory
                key={node.id}
                node={node}
                primary={stories.length === 0 && index === 0}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Flex
        align="center"
        justify="space-between"
        gap={3}
        mb={4}
        flexWrap="wrap"
      >
        <HStack spacing={2}>
          <Icon as={FiStar} color="#D88B4A" />
          <Heading size="md">Your stars</Heading>
        </HStack>
        {stories.length > 0 && (
          <HStack
            bg="#EDEFE5"
            p={1}
            borderRadius="full"
            spacing={1}
            aria-label="Map view"
          >
            <Button
              size="sm"
              borderRadius="full"
              variant={view === "sky" ? "outline" : "ghost"}
              aria-pressed={view === "sky"}
              onClick={() => setView("sky")}
            >
              Night sky
            </Button>
            <Button
              size="sm"
              borderRadius="full"
              variant={view === "cards" ? "outline" : "ghost"}
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              Cards
            </Button>
          </HStack>
        )}
      </Flex>

      {stories.length === 0 ? (
        <Box
          bg="linear-gradient(135deg, #F8FAE9, #FFF5DC 65%, #F7ECDF)"
          border="1px solid #E8E2D3"
          borderRadius="28px"
          px={6}
          py={{ base: 10, md: 14 }}
          textAlign="center"
        >
          <ConstellationStar
            h={{ base: "176px", md: "208px" }}
            label="A smiling star floating among a constellation"
            mb={1}
            mx="auto"
            w={{ base: "176px", md: "208px" }}
          />
          <Heading
            fontFamily={'"Iowan Old Style", Georgia, serif'}
            fontSize="2xl"
          >
            Every night sky starts with one star.
          </Heading>
          <Text
            color={muted}
            maxW="440px"
            mx="auto"
            mt={3}
            mb={6}
            lineHeight="1.7"
          >
            A childhood kitchen. Someone’s laugh. Start with one little moment
            and watch your universe grow.
          </Text>
          {inProgress.length === 0 && (
            <Button
              onClick={startStory}
              isLoading={createConversation.isPending}
              rightIcon={<FiArrowRight />}
              variant="accent"
              size="lg"
              px={8}
            >
              Light your first star
            </Button>
          )}
          <Text fontSize="xs" color={muted} mt={4}>
            Speak or type · Your pace · Always your story
          </Text>
        </Box>
      ) : view === "sky" ? (
        <ConstellationMap stories={stories} relationships={relationships} groups={groupsQuery.data ?? []} />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {stories.map((story, index) => (
            <MemoryCard
              key={story.id}
              story={story}
              accent={accents[index % accents.length]}
              relationships={relationships}
              storyById={storyById}
            />
          ))}
        </SimpleGrid>
      )}

      {relationshipsQuery.isError && stories.length > 0 && (
        <Text color={muted} fontSize="sm" mt={4}>
          Saved memories are here. Connections are temporarily unavailable.
        </Text>
      )}
      {groupsQuery.isError && stories.length > 0 && <Text color={muted} fontSize="sm" mt={4}>Your memories are here, but saved constellations are temporarily unavailable.</Text>}
    </Box>
  )
}

function ContinueStory({
  node,
  primary = false,
}: { node: ConversationPublic; primary?: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activate = useMutation({
    mutationFn: () => ConversationsService.activateStoryNode({ id: node.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversationConstellation"],
      })
      await navigate({
        to: "/conversation/$conversationId",
        params: { conversationId: String(node.id) },
      })
    },
  })
  const open = () => {
    if (node.status === "inactive") activate.mutate()
    else
      void navigate({
        to: "/conversation/$conversationId",
        params: { conversationId: String(node.id) },
      })
  }

  return (
    <Box w={primary ? { base: "full", md: "auto" } : "full"}>
      <Flex
        as="button"
        type="button"
        onClick={open}
        disabled={activate.isPending}
        align="center"
        justify="space-between"
        gap={4}
        minH="76px"
        w="full"
        textAlign="left"
        p={4}
        bg={primary ? "#F7D783" : "white"}
        boxShadow={primary ? "0 4px 0 #C9AA59" : "0 2px 0 #E7EADF"}
        border="1px solid #D6E7E2"
        borderRadius="16px"
        _hover={{ borderColor: "#4B8D82", bg: "#F8FBF8" }}
        _focusVisible={{ outline: "3px solid #D98061", outlineOffset: "3px" }}
        aria-label={`Continue ${node.node_title || "your story"}`}
      >
        <Box minW={0}>
          {primary && (
            <Text fontSize="xs" color="#6D592D" mb={1}>
              {node.status === "inactive"
                ? "EXPLORE THIS PATH"
                : "CONTINUE YOUR STORY"}
            </Text>
          )}
          <Text fontWeight="800" noOfLines={1}>
            {node.node_title || "A story in progress"}
          </Text>
          <Text color={muted} fontSize="sm" mt={1} noOfLines={1}>
            {node.branch_context || "Pick up where you left off"}
          </Text>
        </Box>
        {activate.isPending ? (
          <Spinner size="sm" color="#4B8D82" />
        ) : (
          <Icon as={FiArrowRight} color="#4B8D82" />
        )}
      </Flex>
      {activate.isError && (
        <Text color="red.700" role="alert" fontSize="sm" mt={2}>
          We couldn’t open this path. Please try again.
        </Text>
      )}
    </Box>
  )
}

function MemoryCard({
  story,
  accent,
  relationships,
  storyById,
}: {
  story: StorySummaryPublic
  accent: string
  relationships: StoryRelationshipPublic[]
  storyById: Map<number, StorySummaryPublic>
}) {
  const connected = relationships.flatMap((relationship) => {
    if (relationship.story_a_id === story.id)
      return [storyById.get(relationship.story_b_id)].filter(
        (item): item is StorySummaryPublic => Boolean(item),
      )
    if (relationship.story_b_id === story.id)
      return [storyById.get(relationship.story_a_id)].filter(
        (item): item is StorySummaryPublic => Boolean(item),
      )
    return []
  })
  const date = new Date(story.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  return (
    <Box
      as={Link}
      to="/summary/$summaryId"
      params={{ summaryId: String(story.id) }}
      display="flex"
      flexDirection="column"
      minH="220px"
      bg={paper}
      border="1px solid #E8E2D3"
      borderRadius="18px"
      overflow="hidden"
      color={ink}
      textDecoration="none"
      transition="transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 12px 28px rgba(39,62,61,0.09)",
        borderColor: `${accent}99`,
      }}
      _focusVisible={{ outline: "3px solid #D98061", outlineOffset: "3px" }}
    >
      {story.image_url && (
        <Image
          src={story.image_url}
          alt=""
          h="128px"
          w="full"
          objectFit="cover"
        />
      )}
      <Stack spacing={3} p={4} flex="1">
        <HStack align="flex-start" spacing={3}>
          <Center
            flexShrink={0}
            boxSize="36px"
            borderRadius="12px"
            bg={`${accent}20`}
            color={accent}
          >
            <Icon as={FiStar} />
          </Center>
          <Box minW={0} flex="1">
            <Heading size="sm" lineHeight="1.35" noOfLines={2}>
              {story.title || "A remembered moment"}
            </Heading>
            <Text color={muted} fontSize="xs" mt={1}>
              {date}
            </Text>
          </Box>
          <Icon as={FiArrowRight} mt={1} color={accent} />
        </HStack>
        <Text color={muted} fontSize="sm" lineHeight="1.55" noOfLines={3}>
          {story.summary_text}
        </Text>
        {connected.length > 0 && (
          <Box mt="auto" pt={2} borderTop="1px solid #EFEADD">
            <Text fontSize="xs" color="#4B8D82" fontWeight="700" mb={1}>
              {connected.length > 1 ? "CONNECTED MEMORIES" : "CONNECTED MEMORY"}
            </Text>
            <Text fontSize="sm" color={ink} noOfLines={1}>
              {connected[0].title || "A remembered moment"}
              {connected.length > 1 ? ` and ${connected.length - 1} more` : ""}
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
