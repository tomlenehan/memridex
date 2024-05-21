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
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";

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
    mutationFn: async (data: UserStoryPromptCreate) => {
      const response = await UserStoryPromptsService.createUserStoryPrompt({ requestBody: data });
      return response;
    },
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
    const formData = new FormData();
    formData.append("prompt", data.prompt);
    formData.append("category_id", data.category_id?.toString() || "");
    if (acceptedFiles.length > 0) {
      formData.append("image", acceptedFiles[0]);
    }

    mutation.mutate(formData as any);
  };

  const {
    getRootProps,
    getInputProps,
    acceptedFiles,
  } = useDropzone({ accept: { 'image/*': ['.jpeg', '.jpg', '.png'] } });

  return (
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
          <FormControl mt={4}>
            <FormLabel htmlFor="image_id">Upload Image</FormLabel>
            <Box
              {...getRootProps()}
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="md"
              p={4}
              textAlign="center"
              cursor="pointer"
            >
              <input {...getInputProps()} />
              <Text>Drag 'n' drop an image here, or click to select one</Text>
            </Box>
            {acceptedFiles.length > 0 && (
              <VStack mt={2}>
                {acceptedFiles.map((file) => (
                  <Text key={file.name}>{file.name}</Text>
                ))}
              </VStack>
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
  );
};

export default AddUserStoryPrompt;
