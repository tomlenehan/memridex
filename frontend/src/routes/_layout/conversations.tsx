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
import { useMemo, useRef } from "react"
import { FiArrowRight, FiBookOpen, FiGitBranch, FiPlus, FiStar } from "react-icons/fi"

import {
  ConversationsService,
  SummariesService,
  type ConversationPublic,
  type StoryRelationshipPublic,
  type StorySummaryPublic,
} from "../../client"
import ConstellationStar from "../../components/Common/ConstellationStar"

export const Route = createFileRoute("/_layout/conversations")({
  component: MemoryMap,
})

const ink = "#17353B"
const muted = "#61777A"
const paper = "#FFFDF5"
const accents = ["#D88B4A", "#4B8D82", "#9A78AA", "#CE7667", "#638CAA"]

function MemoryMap() {
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
  const createConversation = useMutation({
    mutationFn: () => ConversationsService.createConversation({ requestBody: {} }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversationConstellation"] })
      await navigate({ to: "/conversation/$conversationId", params: { conversationId: String(conversation.id) } })
    },
    onSettled: () => {
      startRequestInFlight.current = false
    },
  })

  const stories = useMemo(
    () => [...(storiesQuery.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [storiesQuery.data],
  )
  const relationships = relationshipsQuery.data ?? []
  const storyById = useMemo(() => new Map(stories.map((story) => [story.id, story])), [stories])
  const storyConversationIds = useMemo(() => new Set(stories.map((story) => story.conversation_id)), [stories])
  const inProgress = useMemo(
    () => (conversationsQuery.data?.data ?? []).filter((node) => {
      const isOpen = node.status === "active" || (node.status === "inactive" && node.parent_conversation_id == null)
      return isOpen && !storyConversationIds.has(node.id)
    }).sort((a, b) => b.created_at.localeCompare(a.created_at)),
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
      <Flex align={{ base: "stretch", md: "flex-end" }} direction={{ base: "column", md: "row" }} justify="space-between" gap={5} mb={8}>
        <Box maxW="650px">
          <HStack spacing={2} color="#4B8D82" mb={3}>
            <Icon as={FiGitBranch} />
            <Text fontSize="xs" fontWeight="800" letterSpacing="0.13em" textTransform="uppercase">Your memory map</Text>
          </HStack>
          <Heading fontFamily={'"Iowan Old Style", "Palatino Linotype", Georgia, serif'} fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08">
            Your memories
          </Heading>
          <Text color={muted} mt={3} fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
            Keep each story in one place. Connect the ones that belong together.
          </Text>
        </Box>
        <HStack justify={{ base: "space-between", md: "flex-end" }} spacing={3}>
          {stories.length > 0 && <ConstellationStar h="104px" w="104px" />}
          <Button leftIcon={<FiPlus />} onClick={startStory} isLoading={createConversation.isPending} variant="accent" px={6} h="52px" flexShrink={0}>
            Start a story
          </Button>
        </HStack>
      </Flex>

      {hasError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t load part of your memory map. Refresh the page to try again.
        </Alert>
      )}
      {createConversation.isError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t start a story just now. Please try again.
        </Alert>
      )}

      {inProgress.length > 0 && (
        <Box mb={10}>
          <Flex align="center" gap={2} mb={4}>
            <Icon as={FiBookOpen} color="#4B8D82" />
            <Heading size="md">In progress</Heading>
          </Flex>
          <Stack spacing={3}>
            {inProgress.map((node) => <ContinueStory key={node.id} node={node} />)}
          </Stack>
        </Box>
      )}

      <Flex align="center" justify="space-between" gap={3} mb={4}>
        <HStack spacing={2}>
          <Icon as={FiStar} color="#D88B4A" />
          <Heading size="md">Saved memories</Heading>
        </HStack>
        <Text color={muted} fontSize="sm">{stories.length} {stories.length === 1 ? "memory" : "memories"}</Text>
      </Flex>

      {stories.length === 0 ? (
        <Box bg={paper} border="1px solid #E8E2D3" borderRadius="24px" px={6} py={{ base: 10, md: 14 }} textAlign="center">
          <ConstellationStar
            h={{ base: "176px", md: "208px" }}
            label="A smiling star floating among a constellation"
            mb={1}
            mx="auto"
            w={{ base: "176px", md: "208px" }}
          />
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize="2xl">Your first memory is waiting.</Heading>
          <Text color={muted} maxW="440px" mx="auto" mt={3} mb={6} lineHeight="1.7">
            Start with a small moment. You can save it here whenever you’re ready.
          </Text>
          <Button onClick={startStory} isLoading={createConversation.isPending} rightIcon={<FiArrowRight />} variant="primary" px={6}>
            Begin a story
          </Button>
        </Box>
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
        <Text color={muted} fontSize="sm" mt={4}>Saved memories are here. Connections are temporarily unavailable.</Text>
      )}
    </Box>
  )
}

function ContinueStory({ node }: { node: ConversationPublic }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activate = useMutation({
    mutationFn: () => ConversationsService.activateStoryNode({ id: node.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversationConstellation"] })
      await navigate({ to: "/conversation/$conversationId", params: { conversationId: String(node.id) } })
    },
  })
  const open = () => {
    if (node.status === "inactive") activate.mutate()
    else void navigate({ to: "/conversation/$conversationId", params: { conversationId: String(node.id) } })
  }

  return (
    <Flex
      as="button"
      type="button"
      onClick={open}
      align="center"
      justify="space-between"
      gap={4}
      minH="76px"
      w="full"
      textAlign="left"
      p={4}
      bg="white"
      border="1px solid #D6E7E2"
      borderRadius="16px"
      _hover={{ borderColor: "#4B8D82", bg: "#F8FBF8" }}
      _focusVisible={{ outline: "3px solid #D98061", outlineOffset: "3px" }}
      aria-label={`Continue ${node.node_title || "your story"}`}
    >
      <Box minW={0}>
        <Text fontWeight="800" noOfLines={1}>{node.node_title || "A story in progress"}</Text>
        <Text color={muted} fontSize="sm" mt={1} noOfLines={1}>{node.branch_context || "Pick up where you left off"}</Text>
      </Box>
      {activate.isPending ? <Spinner size="sm" color="#4B8D82" /> : <Icon as={FiArrowRight} color="#4B8D82" />}
    </Flex>
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
    if (relationship.story_a_id === story.id) return [storyById.get(relationship.story_b_id)].filter((item): item is StorySummaryPublic => Boolean(item))
    if (relationship.story_b_id === story.id) return [storyById.get(relationship.story_a_id)].filter((item): item is StorySummaryPublic => Boolean(item))
    return []
  })
  const date = new Date(story.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })

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
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 12px 28px rgba(39,62,61,0.09)", borderColor: `${accent}99` }}
      _focusVisible={{ outline: "3px solid #D98061", outlineOffset: "3px" }}
    >
      {story.image_url && <Image src={story.image_url} alt="" h="128px" w="full" objectFit="cover" />}
      <Stack spacing={3} p={4} flex="1">
        <HStack align="flex-start" spacing={3}>
          <Center flexShrink={0} boxSize="36px" borderRadius="12px" bg={`${accent}20`} color={accent}>
            <Icon as={FiStar} />
          </Center>
          <Box minW={0} flex="1">
            <Heading size="sm" lineHeight="1.35" noOfLines={2}>{story.title || "A remembered moment"}</Heading>
            <Text color={muted} fontSize="xs" mt={1}>{date}</Text>
          </Box>
          <Icon as={FiArrowRight} mt={1} color={accent} />
        </HStack>
        <Text color={muted} fontSize="sm" lineHeight="1.55" noOfLines={3}>
          {story.summary_text}
        </Text>
        {connected.length > 0 && (
          <Box mt="auto" pt={2} borderTop="1px solid #EFEADD">
            <Text fontSize="xs" color="#4B8D82" fontWeight="700" mb={1}>{connected.length > 1 ? "CONNECTED MEMORIES" : "CONNECTED MEMORY"}</Text>
            <Text fontSize="sm" color={ink} noOfLines={1}>{connected[0].title || "A remembered moment"}{connected.length > 1 ? ` and ${connected.length - 1} more` : ""}</Text>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
