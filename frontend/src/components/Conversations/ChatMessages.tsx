import { Box, VStack, Text, useColorModeValue } from "@chakra-ui/react";
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
  const bgColor = useColorModeValue("ui.light", "ui.dark");
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const secBgColor = useColorModeValue("ui.secondary", "ui.darkSlate");
  const finalBgColor = useColorModeValue("yellow.200", "yellow.700");

  useEffect(() => {
    dispatch(clearMessages());
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
    <Box flex="1" overflowY="auto" p={4} bg={bgColor} height="100%">
      <VStack spacing={4} align="start">
        {messages.map((message) => (
          <Box
            key={message.id}
            bg={
              (message.sender_type as string) === "ai"
                ? secBgColor
                : (message.sender_type as string) === "final"
                ? finalBgColor
                : "blue.200"
            }
            p={3}
            borderRadius="md"
            alignSelf={
              (message.sender_type as string) === "ai" || (message.sender_type as string) === "final"
                ? "start"
                : "end"
            }
            color={textColor}
          >
            <Text dangerouslySetInnerHTML={{ __html: message.content }} />
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  );
};

export default ChatMessages;
