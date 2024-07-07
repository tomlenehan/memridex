import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
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
  Textarea,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  type ApiError,
  CategoriesService,
  CategoriesPublic,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import axios from 'axios';

// Define the new type for the form data
type FormDataUserStoryPromptCreate = {
  prompt: string;
  category_id?: string;
  image?: File;
};

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
  } = useForm<FormDataUserStoryPromptCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      prompt: "",
      category_id: undefined,
      image: undefined,
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
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      console.error("test");
      // return UserStoryPromptsService.createUserStoryPrompt({ formData: formData as unknown as Body_user_story_prompts_create_user_story_prompt });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user_story_prompts/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
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

  const onSubmit: SubmitHandler<FormDataUserStoryPromptCreate> = (data) => {
    const formData = new FormData();
    formData.append("prompt", data.prompt);
    formData.append("category_id", data.category_id?.toString() || "");
    if (acceptedFiles.length > 0) {
      formData.append("image", acceptedFiles[0]);
    }

    console.log("FormData to be sent:");
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    mutation.mutate(formData);
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
        <ModalHeader>Add Story Prompts</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired isInvalid={!!errors.prompt}>
            <FormLabel htmlFor="prompt">Prompt</FormLabel>
            <Textarea
              id="prompt"
              {...register("prompt", {
                required: "Prompt is required.",
              })}
              placeholder="Prompt"
              size="sm"
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
            <FormLabel htmlFor="image">Upload Image</FormLabel>
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
