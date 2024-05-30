import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { UserStoryPromptsService } from "../../client";
// import Navbar from "../../components/Common/Navbar";

export const Route = createFileRoute("/_layout/conversations")({
  component: Conversations,
});

function UserStoryPromptsList() {
  const { data: userStoryPrompts, isLoading, error } = useQuery({
    queryKey: ["userStoryPrompts"],
    queryFn: () => UserStoryPromptsService.readUserStoryPrompts({}),
  });

  if (isLoading) {
    return (
      <Flex wrap="wrap" justify="center">
        {new Array(5).fill(null).map((_, index) => (
          <Box
            key={index}
            maxW="sm"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            m={4}
          >
            <Skeleton height="200px" />
            <Box p={6}>
              <Skeleton height="20px" width="70%" />
              <Skeleton height="20px" width="50%" mt={2} />
              <Skeleton height="20px" width="60%" mt={2} />
              <Skeleton height="40px" width="100%" mt={4} />
            </Box>
          </Box>
        ))}
      </Flex>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="red.500">
        Something went wrong: {error.message}
      </Box>
    );
  }

  return (
    <Flex wrap="wrap" justify="center">
      {userStoryPrompts?.data.map((prompt) => (
        <Box
          key={prompt.id}
          maxW="sm"
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          m={4}
        >
          {prompt.image?.link ? (
            <Image src={prompt.image.link} alt={prompt.prompt} />
          ) : (
            <Skeleton height="200px" />
          )}
          <Box p={6}>
            <Heading size="md">{prompt.prompt}</Heading>
            <Text mt={2} color="gray.600">
              Category: {prompt.category_id}
            </Text>
            <Text mt={2} color="gray.600">
              User ID: {prompt.user_id}
            </Text>
            <Button mt={4} colorScheme="teal">
              Start Conversation
            </Button>
          </Box>
        </Box>
      ))}
    </Flex>
  );
}

function Conversations() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        User Story Prompts
      </Heading>

      {/*<Navbar type={"Conversation"} />*/}

      <ErrorBoundary
        fallbackRender={({ error }) => (
          <Box textAlign="center" color="red.500">
            Something went wrong: {error.message}
          </Box>
        )}
      >
        <UserStoryPromptsList />
      </ErrorBoundary>
    </Container>
  );
}

export default Conversations;
