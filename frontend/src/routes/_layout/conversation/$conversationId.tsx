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
  Progress,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef } from "react"
import { FiArrowLeft, FiCheck, FiCompass, FiGitBranch } from "react-icons/fi"

import { ConversationsService } from "../../../client"
import ConstellationStar from "../../../components/Common/ConstellationStar"
import ChatInput from "../../../components/Conversations/ChatInput"
import ChatMessages from "../../../components/Conversations/ChatMessages"

export const Route = createFileRoute("/_layout/conversation/$conversationId")({
  component: ConversationPage,
})

function ConversationPage() {
  const { conversationId } = Route.useParams()
  const id = Number(conversationId)
  const queryClient = useQueryClient()
  const branchPollDeadline = useRef<{ id: number; until: number } | null>(null)
  const conversationQuery = useQuery({
    queryKey: ["conversationNode", id],
    queryFn: () => ConversationsService.readConversation({ id }),
    enabled: Number.isInteger(id) && id > 0,
  })
  const mapQuery = useQuery({
    queryKey: ["conversationConstellation"],
    queryFn: () => ConversationsService.readConversations({ limit: 500 }),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: (query) => {
      const conversation = conversationQuery.data
      if (!conversation || (conversation.user_turn_count ?? 0) < 4 || (conversation.node_depth ?? 0) >= 4) return false
      const hasNewPath = query.state.data?.data.some((item) => item.parent_conversation_id === id)
      if (hasNewPath) return false
      if (!branchPollDeadline.current || branchPollDeadline.current.id !== id) {
        branchPollDeadline.current = { id, until: Date.now() + 30_000 }
      }
      return Date.now() < branchPollDeadline.current.until ? 2_500 : false
    },
  })
  const retryBranches = useMutation({
    mutationFn: () => ConversationsService.retryStoryBranches({ id }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversationConstellation"] }),
        queryClient.invalidateQueries({ queryKey: ["conversationNode", id] }),
      ])
    },
  })

  if (!Number.isInteger(id) || id <= 0) {
    return <Alert status="error" borderRadius="xl"><AlertIcon />This story path could not be found.</Alert>
  }

  if (conversationQuery.isLoading) {
    return <Center minH="60vh"><Spinner color="#4B8D82" size="xl" /></Center>
  }
  if (conversationQuery.isError || !conversationQuery.data) {
    return (
      <VStack align="start" spacing={4}>
        <Alert status="error" borderRadius="xl"><AlertIcon />We couldn’t open this story path.</Alert>
        <Button as={Link} to="/conversations" leftIcon={<FiArrowLeft />} variant="outline">Back to memory map</Button>
      </VStack>
    )
  }

  const conversation = conversationQuery.data
  const turns = Math.min(conversation.user_turn_count ?? 0, 4)
  const isFinished = conversation.status === "ready_for_summary" || conversation.status === "complete" || turns >= 4
  const atLastDepth = (conversation.node_depth ?? 0) >= 4
  const branchCount = mapQuery.data?.data.filter((item) => item.parent_conversation_id === id).length ?? 0
  const progress = (turns / 4) * 100

  return (
    <Flex direction="column" minH="640px" h={{ base: "calc(100svh - 120px)", md: "calc(100svh - 144px)" }} maxW="1050px" mx="auto" color="#17353B">
      <Flex justify="space-between" align="center" gap={3} mb={5}>
        <Button
          as={Link}
          to="/conversations"
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          color="#4B716F"
          borderRadius="full"
          size="sm"
          _hover={{ bg: "#E9F1E9" }}
        >
          Story map
        </Button>
        <HStack spacing={2} color="#66807E">
          <Icon as={FiCompass} />
          <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="0.13em">
            Story path {String((conversation.node_depth ?? 0) + 1).padStart(2, "0")}
          </Text>
        </HStack>
      </Flex>

      <Box
        flex="1"
        minH={0}
        display="flex"
        flexDirection="column"
        bg="#FFFDF7"
        border="1px solid #E8E2D3"
        borderRadius={{ base: "22px", md: "30px" }}
        overflow="hidden"
        boxShadow="0 16px 48px rgba(39,62,61,0.06)"
      >
        <Box px={{ base: 4, md: 7 }} pt={{ base: 5, md: 7 }} pb={5} borderBottom="1px solid #EFEADD">
          <Flex align="flex-start" justify="space-between" gap={4}>
            <Box minW={0}>
              {conversation.branch_context && (
                <HStack spacing={2} mb={2} color="#D07F5C">
                  <Icon as={FiGitBranch} boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.03em" noOfLines={1}>
                    Following: {conversation.branch_context}
                  </Text>
                </HStack>
              )}
              <Heading
                fontFamily={'"Iowan Old Style", "Palatino Linotype", Georgia, serif'}
                fontSize={{ base: "2xl", md: "3xl" }}
                lineHeight="1.1"
                letterSpacing="-0.025em"
              >
                {conversation.node_title || "A remembered moment"}
              </Heading>
              <Text mt={2} color="#66807E" fontSize="sm" lineHeight="1.6">
                {isFinished
                  ? atLastDepth
                    ? "This story path is complete. You can save the memory or revisit your constellation."
                    : "This story path is complete. Your next paths are ready to explore."
                  : "Take your time. There are no wrong details, and you can speak or type."}
              </Text>
            </Box>
            <Center
              w={{ base: "42px", md: "50px" }}
              h={{ base: "42px", md: "50px" }}
              flexShrink={0}
              borderRadius="18px"
              bg={isFinished ? "#E7F0E8" : "#F8EBD3"}
              color={isFinished ? "#4B8D82" : "#D08B45"}
            >
              {isFinished ? <Icon as={FiCheck} boxSize={5} /> : <ConstellationStar boxSize="76px" flexShrink={0} />}
            </Center>
          </Flex>
          <Flex align="center" gap={3} mt={5}>
            <Text whiteSpace="nowrap" fontSize="xs" color="#66807E" fontWeight="700">
              {isFinished ? "PATH COMPLETE" : `MOMENT ${turns} OF 4`}
            </Text>
            <Progress
              value={isFinished ? 100 : progress}
              flex="1"
              h="10px"
              borderRadius="full"
              bg="#E9E6DC"
              colorScheme="green"
              sx={{ "& > div": { borderRadius: "full" } }}
            />
            <Text whiteSpace="nowrap" fontSize="xs" color="#66807E">
              {isFinished ? "✦" : `${Math.max(0, 4 - turns)} left`}
            </Text>
          </Flex>
        </Box>

        {isFinished && (
          <Flex
            px={{ base: 4, md: 7 }}
            py={3}
            bg="#F1F5EB"
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={3}
            direction={{ base: "column", sm: "row" }}
          >
            <Text fontSize="sm" color="#476B63">
              {atLastDepth
                ? "You’ve reached the edge of this story map."
                : branchCount
                  ? `${branchCount} new ${branchCount === 1 ? "path is" : "paths are"} waiting on your map.`
                  : "Your next paths are being uncovered from this story."}
            </Text>
            <HStack spacing={2}>
              {!branchCount && !atLastDepth && (
                <Button
                  size="sm"
                  variant="outline"
                  color="#477B70"
                  borderColor="#B7D0C2"
                  borderRadius="full"
                  isLoading={retryBranches.isPending}
                  onClick={() => retryBranches.mutate()}
                >
                  Find paths
                </Button>
              )}
              <Button
                as={Link}
                to="/conversations"
                size="sm"
                variant="ghost"
                color="#426858"
                borderRadius="full"
                _hover={{ bg: "#3D786F" }}
              >
                Open memory map
              </Button>
            </HStack>
          </Flex>
        )}

        {retryBranches.isError && (
          <Alert status="error" py={2}>
            <AlertIcon />Could not uncover paths yet. Please try again.
          </Alert>
        )}

        <Box flex="1" minH={0} overflow="hidden" bg="#FBF9F1">
          <ChatMessages conversationId={id} />
        </Box>
        <ChatInput
          conversationId={id}
          storyFinished={isFinished}
          userTurnCount={conversation.user_turn_count ?? 0}
        />
      </Box>
    </Flex>
  )
}

export default ConversationPage
