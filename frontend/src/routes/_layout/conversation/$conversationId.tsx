import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Text,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import ChatMessages from "../../../components/Conversations/ChatMessages";
import ChatInput from "../../../components/Conversations/ChatInput";
import { IoChevronBackCircleOutline } from "react-icons/io5";

export const Route = createFileRoute("/_layout/conversation/$conversationId")({
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();

  if (!conversationId) {
    return <Box>Error: No conversation ID provided</Box>;
  }

  const conversationIdNumber = Number(conversationId);

  if (Number.isNaN(conversationIdNumber)) {
    return <Box>Error: Invalid conversation ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="flex-start" pt={12} gap={4}>
        <Button as={Link} to="/conversations" marginTop={-6} colorScheme="teal" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Back
        </Button>
        <Box flex="1" textAlign={{ base: "right", md: "left" }}>
          <Heading size="lg">Tell the story your way</Heading>
          <Text color="ui.muted" mt={1}>
            Type when it is easier. Start a voice conversation when it is time to talk it through.
          </Text>
        </Box>
      </Flex>

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
