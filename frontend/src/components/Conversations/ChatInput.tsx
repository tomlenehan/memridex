import { Box, Button, Flex, Input } from "@chakra-ui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, ChatMessageCreate, ChatMessagesService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

interface ChatInputProps {
  conversationId: number;
}

const ChatInput = ({ conversationId }: ChatInputProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChatMessageCreate>({
    defaultValues: {
      conversation_id: conversationId,
      sender_type: "user",
    },
  });
  const queryClient = useQueryClient();
  const showToast = useCustomToast();

  const mutation = useMutation({
    mutationFn: (newMessage: ChatMessageCreate) =>
      ChatMessagesService.createChatMessage({
        conversationId,
        requestBody: newMessage,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", conversationId] });
      reset();
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
  });

  const onSubmit: SubmitHandler<ChatMessageCreate> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
      <Flex>
        <Input
          {...register("content", { required: true })}
          placeholder="Type your message..."
          mr={2}
        />
        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Send
        </Button>
      </Flex>
    </Box>
  );
};

export default ChatInput;
