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
  Select
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import {
  type ApiError,
  type UserStoryPromptCreate,
  UserStoryPromptsService,
  CategoriesService,
  CategoriesPublic,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

interface AddUserStoryPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddUserStoryPrompt = ({ isOpen, onClose }: AddUserStoryPromptProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserStoryPromptCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      prompt: "",
      category_id: undefined,
      image_id: undefined,
    },
  });

  // Fetch categories with a query
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery<CategoriesPublic, ApiError>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await CategoriesService.readCategories();
      return response;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserStoryPromptCreate) =>
      UserStoryPromptsService.createUserStoryPrompt({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User story prompt created successfully.", "success");
      reset();
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

  const onSubmit: SubmitHandler<UserStoryPromptCreate> = (data) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add User Story Prompt</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired isInvalid={!!errors.prompt}>
              <FormLabel htmlFor="prompt">Prompt</FormLabel>
              <Input
                id="prompt"
                {...register("prompt", {
                  required: "Prompt is required.",
                })}
                placeholder="Prompt"
                type="text"
              />
              {errors.prompt && (
                <FormErrorMessage>{errors.prompt.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.category_id}>
              <FormLabel htmlFor="category_id">Category</FormLabel>
              <Select
                id="category_id"
                {...register("category_id")}
                placeholder="Select category"
              >
                {categoriesLoading ? (
                  <option>Loading...</option>
                ) : (
                  categoriesResponse?.data.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </Select>
              {errors.category_id && (
                <FormErrorMessage>{errors.category_id.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.image_id}>
              <FormLabel htmlFor="image_id">Image ID</FormLabel>
              <Input
                id="image_id"
                {...register("image_id")}
                placeholder="Image ID"
                type="number"
              />
              {errors.image_id && (
                <FormErrorMessage>{errors.image_id.message}</FormErrorMessage>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddUserStoryPrompt;
