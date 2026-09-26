import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FiArrowRight, FiBookOpen, FiMessageCircle } from "react-icons/fi";

import {
  ConversationsService,
  SummariesService,
  UserStoryPromptPublic,
  UserStoryPromptsService,
} from "../../client";
import AddConversation from "../../components/Conversations/AddConversation";

export const Route = createFileRoute("/_layout/conversations")({
  component: Conversations,
});

function LoadingGrid() {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
      {new Array(6).fill(null).map((_, index) => (
        <Box
          key={index}
          bg="white"
          border="1px solid"
          borderColor="ui.line"
          borderRadius="8px"
          overflow="hidden"
        >
          <Skeleton height="210px" />
          <Stack p={5} spacing={3}>
            <Skeleton height="22px" width="80%" />
            <Skeleton height="18px" width="45%" />
            <Skeleton height="42px" width="100%" />
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function UserStoryPromptsList() {
  const { data: userStoryPrompts, isLoading, error } = useQuery({
    queryKey: ["userStoryPrompts"],
    queryFn: () => UserStoryPromptsService.readUserStoryPrompts({}),
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => ConversationsService.readConversations({}),
  });

  const { data: summariesData, isLoading: summariesLoading } = useQuery({
    queryKey: ["summaries"],
    queryFn: () => SummariesService.readStorySummaries({}),
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPrompt, setSelectedPrompt] =
    useState<UserStoryPromptPublic | null>(null);

  const handleStartConversation = (prompt: UserStoryPromptPublic) => {
    setSelectedPrompt(prompt);
    onOpen();
  };

  if (isLoading || conversationsLoading || summariesLoading) {
    return <LoadingGrid />;
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        color="ui.danger"
        bg="white"
        border="1px solid"
        borderColor="ui.line"
        borderRadius="8px"
        p={8}
      >
        Something went wrong: {error.message}
      </Box>
    );
  }

  const conversations = conversationsData?.data || [];
  const summaries = summariesData || [];

  const getConversationForPrompt = (promptId: number) => {
    return conversations.find(
      (conversation) => conversation.user_story_prompt_id === promptId,
    );
  };

  const getLatestSummaryForConversation = (conversationId: number) => {
    const conversationSummaries = summaries.filter(
      (summary) => summary.conversation_id === conversationId,
    );
    return conversationSummaries.sort((a, b) => {
      if (!b.modified_at || !a.modified_at) {
        return 0;
      }
      return new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime();
    })[0];
  };

  if (!userStoryPrompts?.data.length) {
    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="ui.line"
        borderRadius="8px"
        p={8}
      >
        <Heading size="md" mb={2}>
          No prompts yet
        </Heading>
        <Text color="ui.muted">Create a prompt to start your first story.</Text>
      </Box>
    );
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
        {userStoryPrompts.data.map((prompt) => {
          const existingConversation = getConversationForPrompt(prompt.id);
          const latestSummary =
            existingConversation && existingConversation.status === "complete"
              ? getLatestSummaryForConversation(existingConversation.id)
              : null;

          return (
            <Box
              key={prompt.id}
              bg="white"
              border="1px solid"
              borderColor="ui.line"
              borderRadius="8px"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
            >
              {prompt.image_url ? (
                <Image
                  src={prompt.image_url}
                  alt={prompt.prompt}
                  h="210px"
                  w="full"
                  objectFit="cover"
                />
              ) : (
                <Skeleton height="210px" />
              )}
              <Stack p={5} spacing={4} flex="1">
                <Flex align="center" justify="space-between" gap={3}>
                  <Badge
                    borderRadius="8px"
                    px={3}
                    py={1}
                    colorScheme="teal"
                    variant="subtle"
                  >
                    {prompt.category?.name || "Uncategorized"}
                  </Badge>
                  {existingConversation && (
                    <Icon as={FiMessageCircle} color="ui.main" boxSize={5} />
                  )}
                </Flex>
                <Heading as="h2" size="md" lineHeight="1.35">
                  {prompt.prompt}
                </Heading>
                <Flex gap={3} flexWrap="wrap" mt="auto">
                  {existingConversation ? (
                    <Button
                      as={Link}
                      to={`/conversation/${existingConversation.id}`}
                      variant="primary"
                      rightIcon={<FiArrowRight />}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleStartConversation(prompt)}
                      rightIcon={<FiMessageCircle />}
                    >
                      Start chat
                    </Button>
                  )}
                  {latestSummary && (
                    <Button
                      as={Link}
                      to={`/summary/${latestSummary.id}`}
                      variant="outline"
                      colorScheme="teal"
                      leftIcon={<FiBookOpen />}
                    >
                      View memory
                    </Button>
                  )}
                </Flex>
              </Stack>
            </Box>
          );
        })}
      </SimpleGrid>
      <AddConversation isOpen={isOpen} onClose={onClose} prompt={selectedPrompt} />
    </>
  );
}

function Conversations() {
  return (
    <Container maxW="7xl" px={0}>
      <Stack spacing={6}>
        <Box>
          <Text color="ui.main" fontWeight="bold" mb={2}>
            Story prompts
          </Text>
          <Heading size="xl" letterSpacing={0}>
            Choose a memory to begin with.
          </Heading>
          <Text color="ui.muted" mt={3} maxW="680px">
            Pick a prompt, continue an existing conversation, or open a finished
            memory when a story is ready.
          </Text>
        </Box>

        <ErrorBoundary
          fallbackRender={({ error }) => (
            <Box textAlign="center" color="ui.danger">
              Something went wrong: {error.message}
            </Box>
          )}
        >
          <UserStoryPromptsList />
        </ErrorBoundary>
      </Stack>
    </Container>
  );
}

export default Conversations;
