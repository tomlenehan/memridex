import { useState, useEffect } from "react";
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
  Image, Textarea,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  type ApiError,
  CategoriesService,
  CategoriesPublic,
  type UserStoryPromptPublic,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import axios from "axios";

// Define the new type for the form data
type FormDataUserStoryPromptUpdate = {
  prompt: string;
  category_id?: string;
  image?: File;
};

interface EditUserStoryPromptProps {
  userStoryPrompt: UserStoryPromptPublic;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserStoryPrompt = ({
  userStoryPrompt,
  isOpen,
  onClose,
}: EditUserStoryPromptProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [newImageUploaded, setNewImageUploaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    setValue,
  } = useForm<FormDataUserStoryPromptUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
  });

  useEffect(() => {
    setValue("prompt", userStoryPrompt.prompt);
    setValue("category_id", userStoryPrompt.category_id?.toString());
    setValue("image", undefined);
  }, [userStoryPrompt, setValue]);

  // Fetch categories with a query
  const { data: categoriesResponse, isLoading: categoriesLoading } =
    useQuery<CategoriesPublic, ApiError>({
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await CategoriesService.readCategories();
        return response;
      },
    });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No access token found");
      }

      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/v1/user_story_prompts/${userStoryPrompt.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("API response data:", response.data);  // Log the response data
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error in API request:', error.response || error.message);
        } else if (error instanceof Error) {
          console.error('Error in API request:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      showToast("Success!", "User story prompt updated successfully.", "success");
      reset();
      onClose();
      // Update specific item within cached data
      queryClient.setQueryData(['userStoryPrompts'], (oldData: any) => {
        return {
          ...oldData,
          data: oldData.data.map((prompt: any) =>
            prompt.id === userStoryPrompt.id ? data : prompt
          )
        };
      });
    },
    onError: (err: ApiError) => {
      console.error('Mutation error:', err);  // Log the error
      const errDetail = (err.body as any)?.detail;
      showToast("Something went wrong.", `${errDetail}`, "error");
    },
  });


  const onSubmit: SubmitHandler<FormDataUserStoryPromptUpdate> = (data) => {
    const formData = new FormData();
    formData.append("prompt", data.prompt);
    formData.append("category_id", data.category_id?.toString() || "");
    if (acceptedFiles.length > 0) {
      formData.append("image", acceptedFiles[0]);
    }

    mutation.mutate(formData);
  };

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    onDrop: () => {
      setNewImageUploaded(true);
    },
  });

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Edit Story Prompt</ModalHeader>
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
            {userStoryPrompt.image_url && !newImageUploaded && (
              <Image
                src={userStoryPrompt.image_url}
                alt="Current image"
                boxSize="50px"
                objectFit="cover"
                mb={2}
              />
            )}
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
          <Button variant="primary" type="submit" isLoading={isSubmitting} isDisabled={!isDirty && !newImageUploaded}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserStoryPrompt;
