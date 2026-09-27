import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Icon,
  Text,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { SummariesService, ContactsService, ContactRead, Body_summaries_update_story_summary, type RelatedStorySuggestion, type StorySummaryPublic } from "../../../client";
import { FiArrowRight, FiGitBranch, FiLink, FiX } from "react-icons/fi";
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
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const showToast = useCustomToast()
  const queryClient = useQueryClient()

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
      setConversationId(response.conversation_id);
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
      await queryClient.invalidateQueries({ queryKey: ["summaries"] })

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

  const fetchContacts = async (): Promise<ContactRead[]> => {
    const response = await ContactsService.readContacts();
    return response;
  };

  const { data: contacts } = useQuery<ContactRead[]>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const handleEmail = () => {
    const formData = watch();
    const emailSubject = formData.title || "Story Summary";
    const emailBody = `
      ${formData.summary}\n
    `;
    const emailRecipients = contacts?.map(contact => contact.email).join(",") || "";
    window.location.href = `mailto:${emailRecipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  if (!summaryId) {
    return <Box>Error: No summary ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" pt={8} gap={3}>
        <Button as={Link} to="/conversations" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Your memories
        </Button>
        {conversationId && (
          <Button
            as={Link}
            to="/conversation/$conversationId"
            params={{ conversationId: String(conversationId) }}
            variant="ghost"
            rightIcon={<FiGitBranch />}
          >
            Revisit conversation
          </Button>
        )}
      </Flex>

      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto" p={4}>
          {status === "loading" ? (
            <Text>Loading summary...</Text>
          ) : status === "failed" ? (
            <Text>Error loading summary</Text>
          ) : (
            <>
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
                variant="primary"
                type="submit"
                isLoading={isSaving}
              >
                Save
              </Button>
              <Button
                mt={4}
                marginLeft={2}
                rightIcon={<CiShare2 />}
                variant="accent"
                onClick={handleEmail}
              >
                Share
              </Button>
            </form>
            <RelatedMemories storyId={Number(summaryId)} />
            </>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default SummaryPage;

function RelatedMemories({ storyId }: { storyId: number }) {
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState<number[]>([])
  const suggestionsQuery = useQuery({
    queryKey: ["relatedStories", storyId],
    queryFn: () => SummariesService.readRelatedStories({ id: storyId, limit: 5 }),
    enabled: Number.isFinite(storyId) && storyId > 0,
  })
  const relationshipsQuery = useQuery({
    queryKey: ["storyRelationships"],
    queryFn: () => SummariesService.readStoryRelationships(),
  })
  const storiesQuery = useQuery({
    queryKey: ["summaries"],
    queryFn: () => SummariesService.readStorySummaries({ limit: 100 }),
  })
  const createLink = useMutation({
    mutationFn: (otherId: number) => SummariesService.createStoryRelationship({ id: storyId, otherId }),
    onSuccess: async (_relationship, otherId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
        queryClient.invalidateQueries({ queryKey: ["relatedStories", storyId] }),
        queryClient.invalidateQueries({ queryKey: ["relatedStories", otherId] }),
      ])
    },
  })
  const removeLink = useMutation({
    mutationFn: (otherId: number) => SummariesService.deleteStoryRelationship({ id: storyId, otherId }),
    onSuccess: async (_result, otherId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
        queryClient.invalidateQueries({ queryKey: ["relatedStories", storyId] }),
        queryClient.invalidateQueries({ queryKey: ["relatedStories", otherId] }),
      ])
    },
  })

  const relationships = relationshipsQuery.data ?? []
  const storyById = new Map((storiesQuery.data ?? []).map((story) => [story.id, story]))
  const connected = relationships.flatMap((relationship) => {
    if (relationship.story_a_id === storyId) return [{ id: relationship.story_b_id, story: storyById.get(relationship.story_b_id) }]
    if (relationship.story_b_id === storyId) return [{ id: relationship.story_a_id, story: storyById.get(relationship.story_a_id) }]
    return []
  }).filter((item): item is { id: number; story: StorySummaryPublic } => Boolean(item.story))
  const connectedIds = new Set(connected.map((item) => item.id))
  const suggestions = (suggestionsQuery.data ?? [])
    .filter((item) => !connectedIds.has(item.story.id) && !dismissed.includes(item.story.id))
    .slice(0, 2)

  if (suggestionsQuery.isLoading || relationshipsQuery.isLoading) {
    return <Flex justify="center" py={8}><Spinner color="#4B8D82" /></Flex>
  }

  return (
    <Stack spacing={5} mt={8} pt={6} borderTop="1px solid" borderColor="ui.line">
      {connected.length > 0 && (
        <Box>
          <HStack spacing={2} mb={3} color="#4B8D82">
            <Icon as={FiLink} />
            <Heading size="sm" color="ui.ink">Connected memories</Heading>
          </HStack>
          <Stack spacing={2}>
            {connected.map(({ id, story }) => (
              <Flex key={id} align="center" justify="space-between" gap={3} p={3} bg="#F1F7F3" borderRadius="12px">
                <Button
                  as={Link}
                  to="/summary/$summaryId"
                  params={{ summaryId: String(id) }}
                  variant="link"
                  rightIcon={<FiArrowRight />}
                  whiteSpace="normal"
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  {story.title || "A remembered moment"}
                </Button>
                <Button
                  aria-label={`Disconnect ${story.title || "memory"}`}
                  title="Remove this connection"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink.mutate(id)}
                  isLoading={removeLink.isPending && removeLink.variables === id}
                  flexShrink={0}
                >
                  <FiX />
                </Button>
              </Flex>
            ))}
          </Stack>
        </Box>
      )}

      {suggestionsQuery.isError ? (
        <Text color="ui.muted" fontSize="sm">Memory connections are temporarily unavailable.</Text>
      ) : suggestions.length > 0 ? (
        <Box>
          <Heading size="sm" mb={2}>Could these stories be connected?</Heading>
          <Text color="ui.muted" fontSize="sm" mb={4}>
            These stories may share a theme. Connect them only if it feels right to you.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {suggestions.map((suggestion: RelatedStorySuggestion) => (
              <Box key={suggestion.story.id} p={4} border="1px solid #E8E2D3" borderRadius="14px" bg="#FFFDF5">
                <Heading size="sm" lineHeight="1.4" mb={3}>{suggestion.story.title || "A remembered moment"}</Heading>
                <Text color="ui.muted" fontSize="sm" lineHeight="1.5" noOfLines={2} mb={3}>
                  {suggestion.story.summary_text}
                </Text>
                <HStack spacing={2}>
                  <Button
                    variant="accent"
                    size="sm"
                    leftIcon={<FiLink />}
                    onClick={() => createLink.mutate(suggestion.story.id)}
                    isLoading={createLink.isPending && createLink.variables === suggestion.story.id}
                  >
                    Connect memories
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDismissed((items) => [...items, suggestion.story.id])}>
                    Not now
                  </Button>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      ) : suggestionsQuery.data?.length === 0 && connected.length === 0 ? (
        <Box>
          <Heading size="sm" mb={2}>Connections</Heading>
          <Text color="ui.muted" fontSize="sm">As you save more memories, possible connections will appear here.</Text>
        </Box>
      ) : null}

      {(createLink.isError || removeLink.isError) && (
        <Text role="alert" color="red.600" fontSize="sm">We couldn’t update this connection. Please try again.</Text>
      )}
    </Stack>
  )
}
