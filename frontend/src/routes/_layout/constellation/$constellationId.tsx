import {
  Alert, AlertIcon, Box, Button, Container, Flex, Heading, HStack, IconButton,
  Image, Input, Spinner, Text, Textarea, useMediaQuery,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiEdit3, FiGlobe, FiLock, FiX } from "react-icons/fi"
import { PUBLIC_SKY_ENABLED } from "../../../config"
import SkyScene from "../../../components/MemoryMap/SkyScene"
import NarrationControl from "../../../components/Common/NarrationControl"
import { nightSkyApi } from "../../../lib/nightSkyApi"

export const Route = createFileRoute("/_layout/constellation/$constellationId")({ component: ConstellationPage })

function ConstellationPage() {
  const { constellationId } = Route.useParams()
  const id = Number(constellationId)
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["constellation", id], queryFn: () => nightSkyApi.get(id), enabled: Number.isInteger(id) && id > 0 })
  const [selected, setSelected] = useState<number | null>(null)
  const [storyCollapsed, setStoryCollapsed] = useState(false)
  const [editingStory, setEditingStory] = useState(false)
  const [title, setTitle] = useState("")
  const [overview, setOverview] = useState("")
  const [wideReader] = useMediaQuery("(min-width: 900px)")

  useEffect(() => {
    if (!query.data) return
    setTitle(query.data.title)
    setOverview(query.data.overview)
  }, [query.data])

  const saveStory = useMutation({
    mutationFn: () => nightSkyApi.update(id, {
      title: title.trim(),
      overview: overview.trim(),
      source_hash: query.data?.source_hash ?? null,
      members: (query.data?.members ?? []).map(({ story_id, x, y, share_story, share_image }) => ({ story_id, x, y, share_story, share_image })),
      links: query.data?.links ?? [],
    }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["constellation", id], updated)
      await queryClient.invalidateQueries({ queryKey: ["constellations"] })
      setEditingStory(false)
    },
  })
  const makePrivate = useMutation({
    mutationFn: () => nightSkyApi.unpublish(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellation", id] }),
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
        queryClient.invalidateQueries({ queryKey: ["publicConstellation"] }),
      ])
    },
  })
  const makePublic = useMutation({
    mutationFn: async () => {
      // Use a non-identifying display name so making a constellation public
      // does not expose the account holder's profile name by default.
      const authorName = "A MemriPlace storyteller"
      const preview = await nightSkyApi.preview(id, authorName)
      if (!preview.preview_token) throw new Error("Couldn’t prepare this constellation for sharing.")
      return nightSkyApi.publish(id, authorName, preview.preview_token)
    },
    onSuccess: async () => {
      makePrivate.reset()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellation", id] }),
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
        queryClient.invalidateQueries({ queryKey: ["publicConstellation"] }),
      ])
    },
  })

  if (query.isLoading) return <Flex minH="55vh" align="center" justify="center"><Spinner size="xl" color="#4B8D82" /></Flex>
  if (query.isError || !query.data) return <Alert status="error" borderRadius="xl"><AlertIcon />Couldn’t open this constellation.</Alert>

  const constellation = query.data
  const member = selected == null ? null : constellation.members[selected]
  const cancelStoryEdit = () => {
    setTitle(constellation.title)
    setOverview(constellation.overview)
    setEditingStory(false)
    saveStory.reset()
  }

  return <Container maxW="6xl" pb={16} px={{ base: 4, md: 8 }}>
    <Box pt={{ base: 5, md: 7 }}>
      <Button as={Link} to="/conversations" variant="ghost" leftIcon={<FiArrowLeft />} color="#286B69" fontWeight="800" _hover={{ bg: "#EDF5EF" }}>
        My night sky
      </Button>
    </Box>
    <Box textAlign="center" pt={{ base: 4, md: 5 }} pb={7}>
      <HStack justify="center" color="#6A8D70" fontSize="xs" fontWeight="800" letterSpacing=".12em">{constellation.publication_id != null ? <FiGlobe /> : <FiLock />} {constellation.publication_id != null ? "SHARED CONSTELLATION" : "YOUR PRIVATE CONSTELLATION"}</HStack>
      <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "3xl", md: "5xl" }} mt={3}>{constellation.title}</Heading>
      <Text color="#61777A" mt={3}>{constellation.members.length} {constellation.members.length === 1 ? "star" : "stars"}</Text>
    </Box>

    <Box className="public-constellation-story" bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={{ base: 5, md: 8 }}>
      <Flex align="center" justify="space-between" gap={3}>
        <Text fontSize="xs" color="#63816C" fontWeight="800" letterSpacing=".1em">
          {storyCollapsed ? "THE STORY · COLLAPSED" : "THE STORY"}
        </Text>
        <HStack spacing={1}>
          {!editingStory && <Button size="sm" variant="ghost" leftIcon={<FiEdit3 />} onClick={() => { setEditingStory(true); saveStory.reset(); }}>
            Edit story
          </Button>}
          {!editingStory && PUBLIC_SKY_ENABLED && <Button size="sm" variant="outline" leftIcon={constellation.publication_id != null ? <FiLock /> : <FiGlobe />}
            onClick={() => {
              makePrivate.reset()
              makePublic.reset()
              if (constellation.publication_id != null) makePrivate.mutate()
              else makePublic.mutate()
            }}
            isLoading={makePrivate.isPending || makePublic.isPending}>
            {constellation.publication_id != null ? "Make private" : "Make public"}
          </Button>}
          {!editingStory && <IconButton
            aria-label={storyCollapsed ? "Expand story" : "Collapse story to enlarge the sky"}
            icon={storyCollapsed ? <FiChevronDown /> : <FiChevronUp />}
            variant="ghost"
            size="sm"
            onClick={() => setStoryCollapsed((collapsed) => !collapsed)}
          />}
        </HStack>
      </Flex>
      {editingStory ? <Box mt={5}>
        <Text fontSize="sm" fontWeight="700" mb={2}>Constellation name</Text>
        <Input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} aria-label="Constellation name" />
        <Text fontSize="sm" fontWeight="700" mt={4} mb={2}>Story</Text>
        <Textarea value={overview} minH={{ base: "220px", md: "280px" }} maxLength={12000} lineHeight="1.8"
          onChange={(event) => setOverview(event.target.value)} aria-label="Constellation story" />
        <HStack mt={4} flexWrap="wrap">
          <Button variant="primary" onClick={() => saveStory.mutate()} isLoading={saveStory.isPending} isDisabled={!title.trim() || !overview.trim()}>
            Save story
          </Button>
          <Button variant="ghost" onClick={cancelStoryEdit} isDisabled={saveStory.isPending}>Cancel</Button>
        </HStack>
        {saveStory.isError && <Text color="red.600" role="alert" mt={3}>{String(saveStory.error)}</Text>}
      </Box> : !storyCollapsed && <>
        <Box mt={4}><NarrationControl path={`constellations/${id}`} /></Box>
        <Text mt={4} whiteSpace="pre-wrap" lineHeight="1.9" fontSize={{ base: "md", md: "lg" }}>{constellation.overview}</Text>
      </>}
      {makePrivate.isError && <Text color="red.600" role="alert" mt={3}>{String(makePrivate.error)}</Text>}
      {makePublic.isError && <Text color="red.600" role="alert" mt={3}>{String(makePublic.error)}</Text>}
      {makePrivate.isSuccess && <Text color="#39725C" role="status" mt={3}>This constellation is now private and no longer appears in the Global Night Sky.</Text>}
      {makePublic.isSuccess && <Text color="#39725C" role="status" mt={3}>This constellation is now public in the Global Night Sky.</Text>}
    </Box>

    <Flex className="public-constellation-sky-row" direction={wideReader ? "row" : "column"} gap={0} mt={4} align="stretch">
      <Box className={member ? "public-sky-map public-sky-map--with-reader" : "public-sky-map"} flex="1" minW={0}>
        <SkyScene stars={constellation.members} links={constellation.links.map((link) => ({
          a: constellation.members.findIndex((item) => item.story_id === link.story_a_id),
          b: constellation.members.findIndex((item) => item.story_id === link.story_b_id),
        }))} selected={selected} onSelect={(index) => setSelected((current) => current === index ? null : index)} label={`Constellation: ${constellation.title}`} />
      </Box>
      {member && <Box as="aside" className="public-sky-memory-reader" aria-label="Selected memory" aria-live="polite">
        <Flex align="start" justify="space-between" gap={3}>
          <Heading className="sky-story-title" fontFamily={'"Iowan Old Style", Georgia, serif'} size="md">{member.title}</Heading>
          <IconButton aria-label="Close memory" icon={<FiX />} variant="ghost" size="sm" onClick={() => setSelected(null)} />
        </Flex>
        <Box mt={4}><NarrationControl path={`memories/${member.story_id}`} /></Box>
        <Text className="sky-story-text" mt={5} lineHeight="1.8" whiteSpace="pre-wrap">{member.summary_text}</Text>
        {member.image_url && <Image src={member.image_url} alt={member.title} mt={4} borderRadius="lg" maxH="230px" objectFit="cover" />}
      </Box>}
    </Flex>
  </Container>
}
