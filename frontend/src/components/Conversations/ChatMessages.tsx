import { Box, VStack, Text } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { fetchMessages, clearMessages } from "../../redux/chatSlice";
import { RootState, AppDispatch } from "../../redux/store";

interface ChatMessagesProps {
  conversationId: number;
}

const ChatMessages = ({ conversationId }: ChatMessagesProps) => {
  const dispatch: AppDispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chat.messages);
  const status = useSelector((state: RootState) => state.chat.status);
  const error = useSelector((state: RootState) => state.chat.error);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   if (status === 'idle') {
  //     dispatch(fetchMessages(conversationId));
  //   }
  // }, [status, dispatch, conversationId]);

  useEffect(() => {
    // Clear messages when conversationId changes
    dispatch(clearMessages());
    // Fetch new messages for the conversation
    dispatch(fetchMessages(conversationId));
  }, [conversationId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (status === 'loading') {
    return <Text>Loading...</Text>;
  }

  if (status === 'failed') {
    return <Text>Error loading messages: {error}</Text>;
  }

  return (
    <Box flex="1" overflowY="auto" p={4} bg="white">
      <VStack spacing={4} align="start">
        {messages.map((message) => (
            <Box key={message.id}
                // bg="gray.200"
                 bg={message.sender_type === "ai" ? "gray.200" : "blue.200"}
                 p={3}
                 borderRadius="md"
                 alignSelf={message.sender_type === "ai" ? "start" : "end"}
                // alignSelf="start"
            >
              <Text>{message.content}</Text>
            </Box>
        ))}
        <div ref={messagesEndRef}/>
      </VStack>
    </Box>
  );
};

export default ChatMessages;
