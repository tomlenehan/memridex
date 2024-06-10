import {
  Box,
  Container,
  Flex,
  Heading
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import ChatMessages from "../../../components/Conversations/ChatMessages";
import ChatInput from "../../../components/Conversations/ChatInput";


export const Route = createFileRoute("/_layout/conversation/$conversationId")({
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();

  if (!conversationId) {
    return <Box>Error: No conversation ID provided</Box>;
  }

  const conversationIdNumber = Number(conversationId);

  if (isNaN(conversationIdNumber)) {
    return <Box>Error: Invalid conversation ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
      </Heading>

      {/* <Navbar type={"Conversation"} /> */}

      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto">
          <ChatMessages conversationId={conversationIdNumber} />
        </Box>
        <Box>
          <ChatInput conversationId={conversationIdNumber} />
        </Box>
      </Flex>
    </Container>
  );
}

export default ConversationPage;