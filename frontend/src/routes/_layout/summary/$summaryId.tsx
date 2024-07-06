import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Image,
  VStack,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { FaRegSave } from "react-icons/fa";
import { CiShare2 } from "react-icons/ci";
import { useForm, SubmitHandler } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { SummariesService, Body_summaries_update_story_summary } from "../../../client";
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/summary/$summaryId")({
  component: SummaryPage,
});

type Status = "idle" | "loading" | "succeeded" | "failed";

interface SummaryFormInputs {
  title: string;
  summary: string;
  image_url?: string;
}

function SummaryPage() {
  const { summaryId } = Route.useParams<{ summaryId: string }>(); // Correct type for summaryId
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SummaryFormInputs>();
  const [status, setStatus] = useState<Status>("idle");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newImageUploaded, setNewImageUploaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const showToast = useCustomToast()

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    onDrop: () => {
      setNewImageUploaded(true);
    },
  });

  const fetchSummary = async (summaryId: string) => {
    setStatus("loading");
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await SummariesService.readStorySummary({ id: Number(summaryId) });

      setValue("summary", response.summary_text || "");
      setValue("title", response.title || "");
      setImageUrl(response.image_url || "");
      setStatus("succeeded");
      console.log("Initial image URL:", response.image_url);
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
  };

  useEffect(() => {
    if (summaryId) {
      fetchSummary(summaryId);
    }
  }, [summaryId, setValue]);

  const onSubmit: SubmitHandler<SummaryFormInputs> = async (data) => {
    setIsSaving(true);
    try {
      const formData: Body_summaries_update_story_summary = {
        title: data.title,
        summary_text: data.summary,
        image: acceptedFiles.length > 0 ? acceptedFiles[0] : null,
      };

      const response = await SummariesService.updateStorySummary({
        id: Number(summaryId),
        formData,
      });

      showToast("Success!", "Summary updated successfully.", "success");
      setStatus("succeeded");

      // Log the response to see if the image URL is being returned
      console.log("Update response:", response);

      // Add a delay before updating the image URL state
      setTimeout(() => {
        setImageUrl(response.image_url || "");
        setNewImageUploaded(false);
      }, 2000); // 2 second delay
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      showToast("Something went wrong.", `${error}`, "error");
      setStatus("failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmail = () => {
    const formData = watch();
    const emailSubject = formData.title || "Story Summary";
    const emailBody = `
      ${formData.summary}\n
    `;
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  if (!summaryId) {
    return <Box>Error: No summary ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" pt={12}>
        <Button as={Link} to="/conversations" marginTop={-6} colorScheme="teal" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Back
        </Button>
        <Heading size="lg" textAlign={{ base: "center", md: "left" }}>
        </Heading>
      </Flex>

      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto" p={4}>
          {status === "loading" ? (
            <Text>Loading summary...</Text>
          ) : status === "failed" ? (
            <Text>Error loading summary</Text>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl isInvalid={!!errors.title}>
                <FormLabel>Title</FormLabel>
                <Input
                  type="text"
                  placeholder={"Enter a meaningful title for your memory here"}
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && <Text color="red.500">{errors.title.message}</Text>}
              </FormControl>
              <FormControl mt={4} isInvalid={!!errors.summary}>
                <FormLabel>Summary</FormLabel>
                <Textarea
                  minHeight={220}
                  {...register("summary", { required: "Summary is required" })}
                />
                {errors.summary && <Text color="red.500">{errors.summary.message}</Text>}
              </FormControl>
              <FormControl mt={4}>
                <FormLabel htmlFor="image">Upload Image</FormLabel>
                <Box
                  {...getRootProps()}
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={4}
                  width="400px"
                  textAlign="left"
                  cursor="pointer"
                >
                  <input {...getInputProps()} />
                  <Text>Drag 'n' drop an image here, or click to select one</Text>
                </Box>
                <VStack mt={2} align="start">
                  <Image
                    src={imageUrl}
                    alt="Current image"
                    boxSize="50px"
                    objectFit="cover"
                    mb={2}
                  />
                  {acceptedFiles.length > 0 && newImageUploaded && (
                    acceptedFiles.map((file) => (
                      <Text color="green" key={file.name}>{file.name}</Text>
                    ))
                  )}
                </VStack>
              </FormControl>
              <Button
                mt={4}
                rightIcon={<FaRegSave />}
                colorScheme="blue"
                type="submit"
                isLoading={isSaving}
              >
                Save
              </Button>
              <Button
                mt={4}
                marginLeft={2}
                rightIcon={<CiShare2 />}
                colorScheme="teal"
                onClick={handleEmail}
              >
                Share
              </Button>
            </form>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default SummaryPage;
