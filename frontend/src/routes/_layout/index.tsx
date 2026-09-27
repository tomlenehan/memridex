import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import ConstellationStar from "../../components/Common/ConstellationStar"
import ProgressTrail from "../../components/Progress/ProgressTrail"
import { useRef } from "react"
import {
  FiArrowRight,
  FiAward,
  FiHome,
  FiMapPin,
  FiUsers,
} from "react-icons/fi"

import {
  ConversationsService,
  UserStoryPromptsService,
  type UserPublic,
  type UserStoryPromptPublic,
} from "../../client"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

const starters = [
  {
    category: "Childhood",
    title: "A memory from growing up",
    description: "A family tradition, a favorite day, or a place you remember.",
    icon: FiHome,
  },
  {
    category: "Influences",
    title: "Someone special",
    description: "Think of someone who made a difference in your life.",
    icon: FiUsers,
  },
  {
    category: "Special Places",
    title: "A favorite place",
    description: "Remember a place where something meaningful happened.",
    icon: FiMapPin,
  },
  {
    category: "Achievements",
    title: "A moment you felt proud",
    description: "Tell the story of something you worked hard to do.",
    icon: FiAward,
  },
]

function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startRequestInFlight = useRef(false)
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const displayName = currentUser?.full_name?.trim().split(/\s+/)[0]
  const promptsQuery = useQuery({
    queryKey: ["storyStarters"],
    queryFn: () => UserStoryPromptsService.readUserStoryPrompts({ limit: 100 }),
  })
  const startStory = useMutation({
    mutationFn: (promptId?: number) =>
      ConversationsService.createConversation({
        requestBody: promptId ? { user_story_prompt_id: promptId } : {},
      }),
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
  const startStoryFromPrompt = (promptId?: number) => {
    if (startRequestInFlight.current) return
    startRequestInFlight.current = true
    startStory.mutate(promptId)
  }

  const promptForCategory = (
    category: string,
  ): UserStoryPromptPublic | undefined =>
    promptsQuery.data?.data.find((prompt) => prompt.category?.name === category)

  return (
    <Container maxW="6xl" px={0}>
      <Stack spacing={{ base: 6, md: 8 }}>
        <ProgressTrail />
        <Flex
          align="center"
          gap={5}
          p={{ base: 6, md: 8 }}
          bg="linear-gradient(120deg, #EDF4E2, #FFF2CE)"
          borderRadius="30px"
          border="1px solid #E2E7D1"
        >
          <Box flex="1">
            <Text color="ui.main" fontWeight="bold" mb={2}>
              {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
            </Text>
            <Heading as="h1" size="xl" letterSpacing={0}>
              A little memory. A little more you.
            </Heading>
            <Text color="ui.muted" mt={3} fontSize={{ base: "lg", md: "xl" }}>
              Your next star could be a person, a place, or a tiny moment that
              stayed with you.
            </Text>
            <Button
              variant="accent"
              size="lg"
              mt={6}
              rightIcon={<FiArrowRight />}
              onClick={() => startStoryFromPrompt()}
              isLoading={startStory.isPending}
            >
              Let’s find a memory
            </Button>
            <Text fontSize="xs" color="ui.muted" mt={4}>
              Speak or type. A few questions, at your own pace.
            </Text>
          </Box>
          <ConstellationStar
            w="200px"
            h="200px"
            flexShrink={0}
            display={{ base: "none", md: "block" }}
          />
        </Flex>
        <Box>
          <Heading size="md">Or follow a little spark</Heading>
          <Text color="ui.muted" fontSize="sm" mt={1}>
            See which one brings something back.
          </Text>
        </Box>

        {promptsQuery.isError && (
          <Alert status="info" borderRadius="8px">
            <AlertIcon />
            You can still begin with any idea below.
          </Alert>
        )}

        {promptsQuery.isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {starters.map((starter) => (
              <Skeleton
                key={starter.category}
                minH="148px"
                borderRadius="8px"
              />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {starters.map((starter) => {
              const prompt = promptForCategory(starter.category)
              const isStarting = startStory.isPending

              return (
                <Button
                  key={starter.category}
                  variant="storyStarter"
                  onClick={() => startStoryFromPrompt(prompt?.id)}
                  isLoading={isStarting}
                  isDisabled={isStarting}
                  aria-label={`Start a story: ${starter.title}`}
                  minH={{ base: "132px", md: "148px" }}
                >
                  <Flex align="center" gap={4} w="full">
                    <Flex
                      align="center"
                      justify="center"
                      flexShrink={0}
                      boxSize="52px"
                      borderRadius="18px"
                      bg={
                        ["#FFF0BD", "#E6DCF0", "#D5EADD", "#F8DDCB"][
                          starters.indexOf(starter)
                        ]
                      }
                      color="ui.mainDark"
                    >
                      <Icon as={starter.icon} boxSize={6} />
                    </Flex>
                    <Stack align="flex-start" spacing={1} flex="1" minW={0}>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color="ui.ink"
                        whiteSpace="normal"
                      >
                        {starter.title}
                      </Text>
                      <Text
                        color="ui.muted"
                        fontSize="md"
                        fontWeight="normal"
                        lineHeight="1.5"
                      >
                        {starter.description}
                      </Text>
                    </Stack>
                    <Icon
                      as={FiArrowRight}
                      color="ui.main"
                      boxSize={5}
                      flexShrink={0}
                    />
                  </Flex>
                </Button>
              )
            })}
          </SimpleGrid>
        )}

        {startStory.isError && (
          <Alert status="error" borderRadius="8px">
            <AlertIcon />
            We couldn’t start a story just now. Please try again.
          </Alert>
        )}

        <Flex
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap={4}
          direction={{ base: "column", sm: "row" }}
          borderTop="1px solid"
          borderColor="ui.line"
          pt={5}
        >
          <Text color="ui.muted" fontSize="md">
            Your stories are saved privately to your account.
          </Text>
          <Button
            as={Link}
            to="/conversations"
            variant="outline"
            rightIcon={<FiArrowRight />}
          >
            See my memories
          </Button>
        </Flex>
      </Stack>
    </Container>
  )
}

export default Dashboard
