import { useEffect } from 'react';
import { Box, Button, Flex, Input, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import { GiSecretBook } from "react-icons/gi";
import { useForm, SubmitHandler } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChatMessageCreate
} from "../../client";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, startStreamingMessage, addStreamingMessage, endStreamingMessage } from "../../redux/chatSlice";
import { RootState, AppDispatch } from "../../redux/store";
import { fetchConversationStatus } from "../../redux/conversationSlice";
import AddSummary from "../../components/Summaries/AddSummary";

interface ChatInputProps {
  conversationId: number;
}

const ChatInput = ({ conversationId }: ChatInputProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChatMessageCreate>({
    defaultValues: {
      sender_type: "user",
      content: "",
    },
  });
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const conversationStatus = useSelector((state: RootState) => state.conversation.status);
  const bgColor = useColorModeValue("ui.light", "ui.dark");
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const secBgColor = useColorModeValue("ui.secondary", "ui.darkSlate");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // Fetch the conversation status on initial load
    dispatch(fetchConversationStatus(conversationId));
  }, [conversationId, dispatch]);

  const handleStream = async (newMessage: ChatMessageCreate) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const tempId = Date.now() + 1;
    dispatch(startStreamingMessage({ id: tempId }));

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat_messages/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newMessage)
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      dispatch(addStreamingMessage({ id: tempId, content: chunk }));
    }

    dispatch(endStreamingMessage());
    queryClient.invalidateQueries({ queryKey: ["chatMessages", conversationId] });

    dispatch(fetchConversationStatus(conversationId));
  };

  const onSubmit: SubmitHandler<ChatMessageCreate> = (data) => {
    const newMessage = { id: Date.now(), sender_type: data.sender_type, content: data.content, timestamp: new Date().toISOString() };
    dispatch(addMessage(newMessage));
    handleStream(data);
    reset();
  };

  const handleSaveMemory = () => {
    onOpen();
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={4} bg={secBgColor} borderTop="1px" borderColor="gray.200" width="100%">
      <Flex>
        <Input
          {...register("content", { required: true })}
          placeholder="Type your message..."
          mr={2}
          bg={bgColor}
          color={textColor}
        />
        <Button type="submit" colorScheme="blue" isLoading={isSubmitting} mr={2}>
          Send
        </Button>
        {(conversationStatus === "ready_for_summary" || conversationStatus === "complete") && (
          <Button colorScheme="green" paddingX={6} onClick={handleSaveMemory} rightIcon={<GiSecretBook />} >
            Save Memory
          </Button>
        )}
      </Flex>

      <AddSummary
        isOpen={isOpen}
        onClose={onClose}
        conversationId={conversationId} // Pass conversationId to the modal
      />
    </Box>
  );
};

export default ChatInput;
