import { Box, Container, Flex, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useParams } from "react-router-dom";
import ChatMessages from "../../components/Conversations/ChatMessages";
import ChatInput from "../../components/Conversations/ChatInput";
import Navbar from "../../components/Common/Navbar";

export const Route = createFileRoute("/_layout/conversation")({
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (!conversationId) {
    return <Box>Error: No conversation ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Conversation
      </Heading>

      <Navbar type={"Conversation"} />
      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto" bg="gray.100">
          <ChatMessages conversationId={Number(conversationId)} />
        </Box>
        <Box>
          <ChatInput conversationId={Number(conversationId)} />
        </Box>
      </Flex>
    </Container>
  );
}
