import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import {
  type ApiError,
  type UserStoryPromptPublic,
  type UserStoryPromptUpdate,
  UserStoryPromptsService,
  CategoriesService,
  CategoriesPublic, // Import the generated types
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

interface EditUserStoryPromptProps {
  prompt: UserStoryPromptPublic;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserStoryPrompt = ({ prompt, isOpen, onClose }: EditUserStoryPromptProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserStoryPromptUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      prompt: prompt.prompt,
      category_id: prompt.category_id,
      image_id: prompt.image_id,
    },
  });

  // Helper function to convert CancelablePromise to standard Promise
  const fetchCategories = (): Promise<CategoriesPublic> => {
    return new Promise<CategoriesPublic>((resolve, reject) => {
      CategoriesService.readCategories({})
        .then((response) => resolve(response))
        .catch((error) => reject(error));
    });
  };

  // Fetch categories with a query
  const { data: categoriesResponse } = useQuery<CategoriesPublic, ApiError>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: (data: UserStoryPromptUpdate) =>
      UserStoryPromptsService.updateUserStoryPrompt({ id: prompt.id, requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User story prompt updated successfully.", "success");
      onClose();
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userStoryPrompts"] });
    },
  });

  const onSubmit: SubmitHandler<UserStoryPromptUpdate> = async (data) => {
    mutation.mutate(data);
  };

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Edit User Story Prompt</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isInvalid={!!errors.prompt}>
            <FormLabel htmlFor="prompt">Prompt</FormLabel>
            <Input
              id="prompt"
              {...register("prompt", { required: "Prompt is required" })}
              type="text"
            />
            {errors.prompt && <FormErrorMessage>{errors.prompt.message}</FormErrorMessage>}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.category_id}>
            <FormLabel htmlFor="category_id">Category</FormLabel>
            <Select
              id="category_id"
              {...register("category_id", { required: "Category is required" })}
              placeholder="Select category"
            >
              {categoriesResponse?.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.category_id && <FormErrorMessage>{errors.category_id.message}</FormErrorMessage>}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.image_id}>
            <FormLabel htmlFor="image_id">Image ID</FormLabel>
            <Input
              id="image_id"
              {...register("image_id")}
              placeholder="Image ID"
              type="number"
            />
            {errors.image_id && <FormErrorMessage>{errors.image_id.message}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="primary" type="submit" isLoading={isSubmitting} isDisabled={!isDirty}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserStoryPrompt;
