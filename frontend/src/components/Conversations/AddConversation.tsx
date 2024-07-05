import {
    Button,
    FormControl,
    FormErrorMessage,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Input,
    Text,
} from "@chakra-ui/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useForm, type SubmitHandler} from "react-hook-form";
import { useRouter } from "@tanstack/react-router";
import {
    ConversationCreate,
    ConversationsService,
    ApiError,
    type UserStoryPromptPublic
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

interface AddConversationProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: UserStoryPromptPublic | null;
}

const AddConversation = ({isOpen, onClose, prompt}: AddConversationProps) => {
    const queryClient = useQueryClient();
    const showToast = useCustomToast();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting},
    } = useForm<ConversationCreate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            user_story_prompt_id: prompt?.id,
        },
    });

    const mutation = useMutation({
        mutationFn: (data: ConversationCreate) =>
            ConversationsService.createConversation({requestBody: data}),
        onSuccess: (data) => {
            showToast("Success!", "Conversation started successfully.", "success");
            reset();
            onClose();
            router.navigate({
                to: "/conversation/$conversationId",
                params: {conversationId: data.id.toString()},
            });
        },
        onError: (err: ApiError) => {
            const errDetail = (err.body as any)?.detail;
            showToast("Something went wrong.", `${errDetail}`, "error");
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["conversations"]});
        },
    });

    const onSubmit: SubmitHandler<ConversationCreate> = (data) => {
        mutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={{base: "sm", md: "md"}} isCentered>
            <ModalOverlay/>
            <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                <ModalHeader>Start Conversation</ModalHeader>
                <ModalCloseButton/>
                <ModalBody pb={6}>
                    <Text>Ready to start this conversation?</Text>
                    <FormControl isInvalid={!!errors.user_story_prompt_id}>
                        <Input
                            type="hidden"
                            {...register("user_story_prompt_id", {
                                required: "Prompt ID is required.",
                            })}
                            defaultValue={prompt?.id}
                        />
                        {errors.user_story_prompt_id && (
                            <FormErrorMessage>{errors.user_story_prompt_id.message}</FormErrorMessage>
                        )}
                    </FormControl>
                </ModalBody>
                <ModalFooter gap={3}>
                    <Button variant="primary" type="submit" isLoading={isSubmitting}>
                        Yes
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddConversation;
