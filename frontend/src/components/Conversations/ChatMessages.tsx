import { Box, VStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ChatMessagesService, ChatMessagesPublic, ChatMessagePublic } from "../../client";
import ChatMessage from "./ChatMessage";

interface ChatMessagesProps {
  conversationId: number;
}

const ChatMessages = ({ conversationId }: ChatMessagesProps) => {
  const { data, isLoading, error } = useQuery<ChatMessagesPublic, Error>({
    queryKey: ["chatMessages", conversationId],
    queryFn: () => ChatMessagesService.readChatMessages({ conversationId: Number(conversationId) }),
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error loading messages</Text>;
  }

  return (
    <Box flex="1" overflowY="auto" p={4} bg="white">
      <VStack spacing={4} align="start">
        {data?.data.map((message: ChatMessagePublic) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </VStack>
    </Box>
  );
};

export default ChatMessages;
