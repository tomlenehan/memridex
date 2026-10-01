import {
  Alert, AlertIcon, Box, Button, Container, Flex, Heading, HStack, IconButton, Image,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, Spinner, Text, Textarea, Tooltip, useMediaQuery,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiFlag, FiHeart, FiStar, FiX } from "react-icons/fi"
import memriPlaceMark from "../../assets/images/MemriPlaceLighterLogo.png"
import AppHeader from "../../components/Common/AppHeader"
import SkyScene from "../../components/MemoryMap/SkyScene"
import NarrationControl from "../../components/Common/NarrationControl"
import { celebrateConstellation } from "../../lib/celebration"
import { nightSkyApi } from "../../lib/nightSkyApi"

export const Route = createFileRoute("/night-sky/$publicationId")({ component: PublicConstellationPage })

function PublicConstellationPage() {
  const { publicationId } = Route.useParams()
  const id = Number(publicationId)
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)
  const [storyCollapsed, setStoryCollapsed] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")
  const signedIn = !!localStorage.getItem("access_token")
  const [wideReader] = useMediaQuery("(min-width: 900px)")
  const query = useQuery({ queryKey: ["publicConstellation", id], queryFn: () => nightSkyApi.publicDetail(id), enabled: Number.isInteger(id) && id > 0 })
  const voteQuery = useQuery({ queryKey: ["publicVote", id], queryFn: () => nightSkyApi.voteStatus(id), enabled: signedIn && query.isSuccess })
  const vote = useMutation({
    mutationFn: async () => {
      const wasCelebrated = Boolean(voteQuery.data?.voted)
      const result = wasCelebrated ? await nightSkyApi.unvote(id) : await nightSkyApi.vote(id)
      return { result, wasCelebrated }
    },
    onSuccess: async ({ result, wasCelebrated }) => {
      queryClient.setQueryData(["publicVote", id], result)
      if (!wasCelebrated && result.voted) celebrateConstellation()
      await queryClient.invalidateQueries({ queryKey: ["publicConstellation", id] })
    },
  })
  const report = useMutation({ mutationFn: () => nightSkyApi.report(id, reason.trim()), onSuccess: () => {
    setReportOpen(false)
    setReason("")
  } })
  const constellation = query.data
  const star = selected == null ? null : constellation?.stars[selected]
  const selectStar = (index: number) => setSelected((current) => current === index ? null : index)
  return <Box bg="#FFFDF5" minH="100vh" color="#17353B">
    {signedIn ? <AppHeader /> : <Flex as="header" px={{ base: 5, md: 10 }} py={4} align="center" justify="space-between" gap={3}>
      <HStack as={Link} to="/landing" spacing={3}><Image src={memriPlaceMark} alt="MemriPlace" boxSize="45px" objectFit="contain" /><Text fontWeight="800">MemriPlace</Text></HStack>
      <HStack spacing={2}>
        <Button as={Link} to="/night-sky" variant="ghost" leftIcon={<FiArrowLeft />} size="sm">Global Night Sky</Button>
        <Button as={Link} to="/login" variant="secondary" size="sm">Log in</Button>
      </HStack>
    </Flex>}
    <Container maxW="6xl" pb={16} px={{ base: 4, md: 8 }}>
      {query.isLoading && <Flex minH="65vh" align="center" justify="center"><Spinner size="xl" color="#4B8D82" /></Flex>}
      {query.isError && <Alert status="error" borderRadius="xl"><AlertIcon />This constellation is unavailable.</Alert>}
      {constellation && <>
        <Box pt={{ base: 5, md: 7 }}>
          <Button as={Link} to="/night-sky" variant="ghost" leftIcon={<FiArrowLeft />} color="#286B69" fontWeight="800"
            _hover={{ bg: "#EDF5EF" }}>
            Back to Global Night Sky
          </Button>
        </Box>
        <Box textAlign="center" pt={{ base: 4, md: 5 }} pb={7}>
          <HStack justify="center" color="#6A8D70" fontSize="xs" fontWeight="800" letterSpacing=".12em"><FiStar /> A SHARED STORY</HStack>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "3xl", md: "5xl" }} mt={3}>{constellation.title}</Heading>
          <Text color="#61777A" mt={3}>{constellation.author_name} · Level {constellation.author_level} · {constellation.stars.length} stars</Text>
        </Box>
        <Box className="public-constellation-story" bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={{ base: 5, md: 8 }}>
          <Flex align="center" justify="space-between" gap={3}>
            <Text fontSize="xs" color="#63816C" fontWeight="800" letterSpacing=".1em">
              {storyCollapsed ? "THE STORY · COLLAPSED" : "THE STORY"}
            </Text>
            <IconButton
              aria-label={storyCollapsed ? "Expand story" : "Collapse story to enlarge the sky"}
              icon={storyCollapsed ? <FiChevronDown /> : <FiChevronUp />}
              variant="ghost"
              size="sm"
              onClick={() => setStoryCollapsed((collapsed) => !collapsed)}
            />
          </Flex>
          {!storyCollapsed && <>
            {constellation.overview && <Box mt={4}><NarrationControl path={`public/${id}`} publicStory /></Box>}
          </>}
          <Flex mt={4} gap={3} align="center" flexWrap="wrap">
            <Tooltip label="Sign in to celebrate this constellation." hasArrow shouldWrapChildren isDisabled={signedIn}>
              <Button leftIcon={<FiHeart fill={voteQuery.data?.voted ? "currentColor" : "none"} />} variant="accent" onClick={() => vote.mutate()}
                isLoading={vote.isPending} isDisabled={!signedIn || voteQuery.isLoading}
                _hover={{ bg: "#F2C96D", transform: "none", boxShadow: "0 3px 0 #C99B3F, 0 6px 12px rgba(132, 93, 27, 0.12)" }}>
                {voteQuery.data?.voted ? "Celebrated" : "Celebrate"} · {voteQuery.data?.votes ?? constellation.votes}
              </Button>
            </Tooltip>
            {signedIn && <Button size="sm" variant="ghost" leftIcon={<FiFlag />} onClick={() => setReportOpen(true)}>Report a concern</Button>}
          </Flex>
          {vote.isError && <Text color="red.600" role="alert" mt={2}>{String(vote.error)}</Text>}
          {!storyCollapsed && <>
            <Text mt={4} whiteSpace="pre-wrap" lineHeight="1.9" fontSize={{ base: "md", md: "lg" }}>{constellation.overview}</Text>
          </>}
        </Box>
        <Flex className={storyCollapsed ? "public-constellation-sky-row public-constellation-sky-row--story-collapsed" : "public-constellation-sky-row"} direction={wideReader ? "row" : "column"} gap={0} mt={4} align="stretch">
          <Box className={star && wideReader ? "public-sky-map public-sky-map--with-reader" : "public-sky-map"} flex="1" minW={0}>
            <SkyScene stars={constellation.stars} links={constellation.links} selected={selected} onSelect={selectStar} label={`Constellation: ${constellation.title}`} />
          </Box>
          {star && <Box as="aside" className="public-sky-memory-reader" aria-label="Selected memory" aria-live="polite">
            <Flex align="start" justify="space-between" gap={3}>
              <Heading className="sky-story-title" fontFamily={'"Iowan Old Style", Georgia, serif'} size="md">{star.title}</Heading>
              <IconButton aria-label="Close memory" icon={<FiX />} variant="ghost" size="sm" onClick={() => setSelected(null)} />
            </Flex>
            {star.story_text && <Box mt={4}><NarrationControl path={`public/${id}/memories/${star.index}`} publicStory /></Box>}
            {star.story_text ? <Text className="sky-story-text" mt={5} lineHeight="1.8" whiteSpace="pre-wrap">{star.story_text}</Text> :
              <Text color="ui.muted" mt={3}>This storyteller kept the memory itself private. Its star still belongs to the shared shape.</Text>}
            {star.image_url && <Image src={star.image_url} alt={star.title} mt={4} borderRadius="lg" maxH="230px" objectFit="cover" />}
          </Box>}
        </Flex>
      </>}
    </Container>
    <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} isCentered><ModalOverlay /><ModalContent borderRadius="24px">
      <ModalHeader>Report a concern</ModalHeader><ModalCloseButton /><ModalBody>
        <Text color="ui.muted" mb={3}>Tell us what needs review. Your report is private.</Text>
        <Textarea value={reason} maxLength={500} minH="130px" onChange={(e) => setReason(e.target.value)} placeholder="What concerns you about this constellation?" />
        {report.isError && <Text color="red.600" role="alert" mt={2}>{String(report.error)}</Text>}
      </ModalBody><ModalFooter><Button onClick={() => report.mutate()} isLoading={report.isPending} isDisabled={reason.trim().length < 10}>Send report</Button></ModalFooter></ModalContent>
    </Modal>
  </Box>
}
