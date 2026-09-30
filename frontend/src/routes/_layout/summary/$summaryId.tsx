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
  Input,
  Spinner,
  Textarea,
  Image,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { IoChevronBackCircleOutline } from "react-icons/io5"
import { useEffect, useState } from "react"
import { FaRegSave } from "react-icons/fa"
import { CiShare2 } from "react-icons/ci"
import { useForm, SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"
import {
  SummariesService,
  ContactsService,
  ContactRead,
  Body_summaries_update_story_summary,
  type StoryRelationshipPublic,
  type StorySummaryPublic,
} from "../../../client"
import { FiGitBranch, FiImage } from "react-icons/fi"
import ConstellationStar from "../../../components/Common/ConstellationStar"
import ConnectionConstellation from "../../../components/MemoryMap/ConnectionConstellation"
import NarrationControl from "../../../components/Common/NarrationControl"
import useCustomToast from "../../../hooks/useCustomToast"
import { celebrateConnection } from "../../../lib/celebration"
import { API_BASE_URL } from "../../../config"

export const Route = createFileRoute("/_layout/summary/$summaryId")({
  component: SummaryPage,
})

type Status = "idle" | "loading" | "succeeded" | "failed"

interface SummaryFormInputs {
  title: string
  summary: string
  image_url?: string
}

function SummaryPage() {
  const { summaryId } = Route.useParams<{ summaryId: string }>() // Correct type for summaryId
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SummaryFormInputs>()
  const [status, setStatus] = useState<Status>("idle")
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [newImageUploaded, setNewImageUploaded] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>()
  const [generatedImageFile, setGeneratedImageFile] = useState<File | undefined>()
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [conversationId, setConversationId] = useState<number | undefined>(undefined)
  const [currentStory, setCurrentStory] = useState<StorySummaryPublic | undefined>()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    onDrop: () => {
      setNewImageUploaded(true)
      setGeneratedImageFile(undefined)
    },
  })

  useEffect(() => {
    const file = acceptedFiles[0]
    if (!file) {
      setPendingImageUrl(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPendingImageUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [acceptedFiles])

  const displayedImageUrl = newImageUploaded ? pendingImageUrl : imageUrl

  useEffect(() => {
    setImageLoadFailed(false)
  }, [displayedImageUrl])

  const fetchSummary = async (summaryId: string) => {
    setStatus("loading")
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("No access token found")
      }

      const response = await SummariesService.readStorySummary({
        id: Number(summaryId),
      })

      setValue("summary", response.summary_text || "")
      setValue("title", response.title || "")
      setImageUrl(response.image_url || undefined)
      setConversationId(response.conversation_id)
      setCurrentStory(response)
      setStatus("succeeded")
      console.log("Initial image URL:", response.image_url)
    } catch (error) {
      console.error(error)
      setStatus("failed")
    }
  }

  useEffect(() => {
    if (summaryId) {
      fetchSummary(summaryId)
    }
  }, [summaryId, setValue])

  const onSubmit: SubmitHandler<SummaryFormInputs> = async (data) => {
    setIsSaving(true)
    try {
      const formData: Body_summaries_update_story_summary = {
        title: data.title,
        summary_text: data.summary,
        image: generatedImageFile ?? acceptedFiles[0] ?? null,
      }

      const response = await SummariesService.updateStorySummary({
        id: Number(summaryId),
        formData,
      })
      await queryClient.invalidateQueries({ queryKey: ["summaries"] })

      showToast("Success!", "Summary updated successfully.", "success")
      setStatus("succeeded")

      setImageUrl(response.image_url || undefined)
      setCurrentStory(response)
      setNewImageUploaded(false)
      setGeneratedImageFile(undefined)
    } catch (error) {
      console.error(error)
      setIsSaving(false)
      showToast("Something went wrong.", `${error}`, "error")
      setStatus("failed")
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true)
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Please sign in again before creating an image.")

      const response = await fetch(`${API_BASE_URL}/api/v1/summaries/${summaryId}/generate-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: watch("title"),
          summary_text: watch("summary"),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || "Could not create an image.")

      const binary = atob(result.image_base64)
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
      const mimeType = result.mime_type || "image/png"
      setGeneratedImageFile(new File([bytes], "memriplace-story.png", { type: mimeType }))
      setPendingImageUrl(`data:${mimeType};base64,${result.image_base64}`)
      setNewImageUploaded(true)
      setImageLoadFailed(false)
      showToast("Your story art is ready", "Save the summary to keep this illustration.", "success")
    } catch (error) {
      console.error(error)
      showToast("Image could not be created", `${error}`, "error")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const fetchContacts = async (): Promise<ContactRead[]> => {
    const response = await ContactsService.readContacts()
    return response
  }

  const { data: contacts } = useQuery<ContactRead[]>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  })

  const handleEmail = () => {
    const formData = watch()
    const emailSubject = formData.title || "Story Summary"
    const emailBody = `
      ${formData.summary}\n
    `
    const emailRecipients = contacts?.map((contact) => contact.email).join(",") || ""
    window.location.href = `mailto:${emailRecipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  }

  if (!summaryId) {
    return <Box>Error: No summary ID provided</Box>
  }

  return (
    <Container maxW="5xl" minH="100vh" px={{ base: 0, md: 4 }} display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" pt={8} gap={3}>
        <Button as={Link} to="/conversations" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Your memories
        </Button>
        {conversationId && (
          <Button as={Link} to="/conversation/$conversationId" params={{ conversationId: String(conversationId) }} variant="ghost" rightIcon={<FiGitBranch />}>
            Revisit conversation
          </Button>
        )}
      </Flex>

      <Flex mt={6} p={{ base: 4, md: 6 }} bg="#F0F5E7" border="1px solid #DFE7D5" borderRadius="24px" align="center" gap={3}>
        <ConstellationStar boxSize={{ base: "80px", md: "112px" }} />
        <Box>
          <Text fontSize="xs" color="#63816C" fontWeight="800" letterSpacing=".1em">
            A LITTLE LIGHT, KEPT FOREVER
          </Text>
          <Heading size="lg" mt={1}>
            One more piece of your story.
          </Heading>
          <Text color="ui.muted" mt={2} fontSize="sm">
            Make it sound like you, add a photo, or connect it to another memory.
          </Text>
          {currentStory && watch("summary") === currentStory.summary_text && watch("title") === currentStory.title &&
            <Box mt={4}><NarrationControl path={`memories/${currentStory.id}`} /></Box>}
          {currentStory && (watch("summary") !== currentStory.summary_text || watch("title") !== currentStory.title) &&
            <Text fontSize="sm" color="ui.muted" mt={3}>Save your changes to hear this version.</Text>}
        </Box>
      </Flex>
      {status === "succeeded" && <RelatedMemories storyId={Number(summaryId)} currentStory={currentStory} />}
      <Flex flex="1" direction="column" mt={4} bg="white" borderRadius="24px" border="1px solid #E5E8DC">
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
                  <Input type="text" placeholder={"Enter a meaningful title for your memory here"} {...register("title", { required: "Title is required" })} />
                  {errors.title && <Text color="red.500">{errors.title.message}</Text>}
                </FormControl>
                <FormControl mt={4} isInvalid={!!errors.summary}>
                  <FormLabel>Your memory</FormLabel>
                  <Textarea
                    minHeight={280}
                    bg="#FFFEF9"
                    lineHeight="1.8"
                    {...register("summary", {
                      required: "Summary is required",
                    })}
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
                    w="full"
                    maxW="400px"
                    textAlign="left"
                    cursor="pointer"
                  >
                    <input {...getInputProps()} />
                    <Text>Drag 'n' drop an image here, or click to select one</Text>
                  </Box>
                  <Button
                    type="button"
                    mt={3}
                    leftIcon={<Icon as={FiImage} />}
                    variant="outline"
                    onClick={handleGenerateImage}
                    isLoading={isGeneratingImage}
                    isDisabled={!watch("summary")?.trim() || isSaving}
                  >
                    Create story illustration
                  </Button>
                  <Text fontSize="xs" color="ui.muted" mt={1}>
                    Optional · sends this summary to OpenAI · about $0.006 per image
                  </Text>
                  <VStack mt={3} align="stretch" maxW="400px">
                    {displayedImageUrl && !imageLoadFailed ? (
                      <Image
                        src={displayedImageUrl}
                        alt={newImageUploaded ? "Selected image preview" : "Current memory"}
                        w="full"
                        maxH="240px"
                        objectFit="cover"
                        borderRadius="18px"
                        border="1px solid #DFE7D5"
                        onError={() => setImageLoadFailed(true)}
                      />
                    ) : (
                      <Flex align="center" gap={3} p={4} bg="#F6F7EF" border="1px solid #E2E7D8" borderRadius="18px" color="ui.muted">
                        <Flex align="center" justify="center" boxSize="42px" flexShrink={0} bg="white" borderRadius="14px">
                          <Icon as={FiImage} boxSize={5} />
                        </Flex>
                        <Box>
                          <Text color="ui.ink" fontWeight="700" fontSize="sm">
                            {imageLoadFailed ? "This photo couldn’t be loaded" : "No photo added yet"}
                          </Text>
                          <Text fontSize="xs" mt={1}>
                            {imageLoadFailed ? "Choose another image to replace it." : "Add one if it helps bring this memory to life."}
                          </Text>
                        </Box>
                      </Flex>
                    )}
                    {acceptedFiles.length > 0 &&
                      newImageUploaded &&
                      !generatedImageFile &&
                      acceptedFiles.map((file) => (
                        <Text color="green" key={file.name}>
                          {file.name}
                        </Text>
                      ))}
                  </VStack>
                </FormControl>
                <Button mt={4} rightIcon={<FaRegSave />} variant="primary" type="submit" isLoading={isSaving}>
                  Save
                </Button>
                <Button mt={4} marginLeft={2} rightIcon={<CiShare2 />} variant="accent" onClick={handleEmail}>
                  Share
                </Button>
              </form>
            </>
          )}
        </Box>
      </Flex>
    </Container>
  )
}

export default SummaryPage

function RelatedMemories({ storyId, currentStory }: { storyId: number; currentStory?: StorySummaryPublic }) {
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState<number[]>([])
  const [recentlyConnectedId, setRecentlyConnectedId] = useState<number | null>(null)
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
    onSuccess: async (relationship, otherId) => {
      queryClient.setQueryData<StoryRelationshipPublic[]>(["storyRelationships"], (current = []) =>
        current.some((item) => item.id === relationship.id) ? current : [...current, relationship],
      )
      setRecentlyConnectedId(otherId)
      celebrateConnection()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
        queryClient.invalidateQueries({
          queryKey: ["relatedStories", storyId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["relatedStories", otherId],
        }),
      ])
    },
  })
  const removeLink = useMutation({
    mutationFn: (otherId: number) => SummariesService.deleteStoryRelationship({ id: storyId, otherId }),
    onSuccess: async (_result, otherId) => {
      queryClient.setQueryData<StoryRelationshipPublic[]>(["storyRelationships"], (current = []) =>
        current.filter((item) => !(
          (item.story_a_id === storyId && item.story_b_id === otherId) ||
          (item.story_b_id === storyId && item.story_a_id === otherId)
        )),
      )
      setRecentlyConnectedId(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
        queryClient.invalidateQueries({
          queryKey: ["relatedStories", storyId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["relatedStories", otherId],
        }),
      ])
    },
  })

  const relationships = relationshipsQuery.data ?? []
  const storyById = new Map((storiesQuery.data ?? []).map((story) => [story.id, story]))
  if (currentStory) storyById.set(currentStory.id, currentStory)
  for (const suggestion of suggestionsQuery.data ?? []) storyById.set(suggestion.story.id, suggestion.story)
  const connected = relationships
    .flatMap((relationship) => {
      if (relationship.story_a_id === storyId)
        return [
          {
            id: relationship.story_b_id,
            story: storyById.get(relationship.story_b_id),
          },
        ]
      if (relationship.story_b_id === storyId)
        return [
          {
            id: relationship.story_a_id,
            story: storyById.get(relationship.story_a_id),
          },
        ]
      return []
    })
    .filter((item): item is { id: number; story: StorySummaryPublic } => Boolean(item.story))
  const connectedIds = new Set(connected.map((item) => item.id))
  const suggestions = (suggestionsQuery.data ?? [])
    .filter((item) => !connectedIds.has(item.story.id) && !dismissed.includes(item.story.id))
    .slice(0, 2)
  const displayedConnected = connected.slice(0, 4 - suggestions.length)

  if (suggestionsQuery.isLoading || relationshipsQuery.isLoading || storiesQuery.isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner color="#4B8D82" />
      </Flex>
    )
  }

  return (
    <Box mt={5}>
      <ConnectionConstellation
        currentStory={storyById.get(storyId)}
        connected={displayedConnected.map(({ story }) => story)}
        suggestions={suggestions}
        hiddenConnectionCount={Math.max(0, connected.length - displayedConnected.length)}
        connectingId={createLink.isPending ? createLink.variables : undefined}
        disconnectingId={removeLink.isPending ? removeLink.variables : undefined}
        recentlyConnectedId={recentlyConnectedId}
        onConnect={(id) => createLink.mutate(id)}
        onDisconnect={(id) => removeLink.mutate(id)}
        onDismiss={(id) => setDismissed((items) => [...items, id])}
      />
      {suggestionsQuery.isError && (
        <Text color="ui.muted" fontSize="sm" mt={4}>
          Possible connections are temporarily unavailable. Your saved links are still here.
        </Text>
      )}
      {(createLink.isError || removeLink.isError) && (
        <Text role="alert" color="red.600" fontSize="sm" mt={4}>
          We couldn’t update this connection. Please try again.
        </Text>
      )}
    </Box>
  )
}
