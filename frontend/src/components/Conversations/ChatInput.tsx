import { Box, Button, Flex, Input, useColorModeValue } from "@chakra-ui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessageCreate } from "../../client";
import { useDispatch } from "react-redux";
import { addMessage, startStreamingMessage, addStreamingMessage, endStreamingMessage } from "../../redux/chatSlice";

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
  const dispatch = useDispatch();

  // Color scheme values
  const bgColor = useColorModeValue("ui.light", "ui.dark");
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const secBgColor = useColorModeValue("ui.secondary", "ui.darkSlate");

  const handleStream = async (newMessage: ChatMessageCreate) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const tempId = Date.now() + 1;
    dispatch(startStreamingMessage({ id: tempId }));

    const response = await fetch(`/api/v1/chat_messages/${conversationId}/messages`, {
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
  };

  const onSubmit: SubmitHandler<ChatMessageCreate> = (data) => {
    const newMessage = { id: Date.now(), sender_type: data.sender_type, content: data.content, timestamp: new Date().toISOString() };
    dispatch(addMessage(newMessage));
    handleStream(data);
    reset();
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={4} bg={secBgColor} borderTop="1px" borderColor="gray.200">
      <Flex>
        <Input
          {...register("content", { required: true })}
          placeholder="Type your message..."
          mr={2}
          bg={bgColor}
          color={textColor}
        />
        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Send
        </Button>
      </Flex>
    </Box>
  );
};

export default ChatInput;
