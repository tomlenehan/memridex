import { Box, Text } from "@chakra-ui/react";
import { ChatMessagePublic } from "../../client";

interface ChatMessageProps {
  message: ChatMessagePublic;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <Box
      // bg={message.sender_type === "ai" ? "gray.200" : "blue.200"}
      bg={message.sender_type === "ai" ? "gray.200" : "blue.200"}
      p={3}
      borderRadius="md"
      // alignSelf={message.sender_type === "ai" ? "start" : "end"}
      alignSelf="start"
    >
      <Text>{message.content}</Text>
    </Box>
  );
};

export default ChatMessage;
