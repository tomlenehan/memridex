import {
  Alert, AlertIcon, Box, Button, Container, Flex, Heading, HStack, Image,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, Spinner, Text, Textarea,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowLeft, FiFlag, FiHeart, FiStar } from "react-icons/fi"
import memriPlaceMark from "../../assets/images/MemriPlaceLighterLogo.png"
import SkyScene from "../../components/MemoryMap/SkyScene"
import { nightSkyApi } from "../../lib/nightSkyApi"

export const Route = createFileRoute("/night-sky/$publicationId")({ component: PublicConstellationPage })

function PublicConstellationPage() {
  const { publicationId } = Route.useParams()
  const id = Number(publicationId)
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number | null>(0)
  const [storyOpen, setStoryOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")
  const signedIn = !!localStorage.getItem("access_token")
  const query = useQuery({ queryKey: ["publicConstellation", id], queryFn: () => nightSkyApi.publicDetail(id), enabled: Number.isInteger(id) && id > 0 })
  const voteQuery = useQuery({ queryKey: ["publicVote", id], queryFn: () => nightSkyApi.voteStatus(id), enabled: signedIn && query.isSuccess })
  const vote = useMutation({
    mutationFn: () => voteQuery.data?.voted ? nightSkyApi.unvote(id) : nightSkyApi.vote(id),
    onSuccess: async (result) => {
      queryClient.setQueryData(["publicVote", id], result)
      await queryClient.invalidateQueries({ queryKey: ["publicConstellation", id] })
    },
  })
  const report = useMutation({ mutationFn: () => nightSkyApi.report(id, reason.trim()), onSuccess: () => {
    setReportOpen(false)
    setReason("")
  } })
  const constellation = query.data
  const star = selected == null ? null : constellation?.stars[selected]
  const selectStar = (index: number) => {
    setSelected(index)
    setStoryOpen(true)
  }
  return <Box bg="#FFFDF5" minH="100vh" color="#17353B">
    <Flex as="header" px={{ base: 5, md: 10 }} py={4} align="center" justify="space-between" gap={3}>
      <HStack as={Link} to="/landing" spacing={3}><Image src={memriPlaceMark} alt="MemriPlace" boxSize="45px" objectFit="contain" /><Text fontWeight="800">MemriPlace</Text></HStack>
      <Button as={Link} to="/night-sky" variant="ghost" leftIcon={<FiArrowLeft />}>Public night sky</Button>
    </Flex>
    <Container maxW="6xl" pb={16} px={{ base: 4, md: 8 }}>
      {query.isLoading && <Flex minH="65vh" align="center" justify="center"><Spinner size="xl" color="#4B8D82" /></Flex>}
      {query.isError && <Alert status="error" borderRadius="xl"><AlertIcon />This constellation is unavailable.</Alert>}
      {constellation && <>
        <Box textAlign="center" pt={{ base: 8, md: 12 }} pb={7}>
          <HStack justify="center" color="#6A8D70" fontSize="xs" fontWeight="800" letterSpacing=".12em"><FiStar /> SHARED BY CHOICE</HStack>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "3xl", md: "5xl" }} mt={3}>{constellation.title}</Heading>
          <Text color="#61777A" mt={3}>{constellation.author_name} · Level {constellation.author_level} · {constellation.stars.length} stars</Text>
        </Box>
        <SkyScene stars={constellation.stars} links={constellation.links} selected={selected} onSelect={selectStar} label={`Constellation: ${constellation.title}`} />
        <Flex direction={{ base: "column", lg: "row" }} gap={6} mt={7} align="start">
          <Box flex="1" bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={{ base: 5, md: 8 }}>
            <Text fontSize="xs" color="#63816C" fontWeight="800" letterSpacing=".1em">THE STORY OF THIS CONSTELLATION</Text>
            <Text mt={4} whiteSpace="pre-wrap" lineHeight="1.9" fontSize={{ base: "md", md: "lg" }}>{constellation.overview}</Text>
          </Box>
          <Box w={{ base: "full", lg: "340px" }} bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={6}>
            <Heading size="sm">{star?.title || "Choose a star"}</Heading>
            {star?.story_text ? <Text mt={4} lineHeight="1.8" whiteSpace="pre-wrap">{star.story_text}</Text> :
              <Text color="ui.muted" mt={3}>This storyteller kept the memory itself private. Its star still belongs to the shared shape.</Text>}
            {star?.image_url && <Image src={star.image_url} alt={star.title} mt={4} borderRadius="lg" maxH="230px" objectFit="cover" />}
            <Box mt={6} pt={5} borderTop="1px solid #E2E9DB">
              <Button leftIcon={<FiHeart fill={voteQuery.data?.voted ? "currentColor" : "none"} />} variant="accent" onClick={() => vote.mutate()}
                isLoading={vote.isPending} isDisabled={!signedIn || voteQuery.isLoading}>
                {voteQuery.data?.voted ? "Appreciated" : "Appreciate"} · {voteQuery.data?.votes ?? constellation.votes}
              </Button>
              {!signedIn && <Text color="ui.muted" mt={2} fontSize="xs"><Link to="/landing">Sign in</Link> to appreciate a constellation.</Text>}
              {vote.isError && <Text color="red.600" role="alert" mt={2}>{String(vote.error)}</Text>}
              {signedIn && <Button size="sm" mt={3} variant="ghost" leftIcon={<FiFlag />} onClick={() => setReportOpen(true)}>Report a concern</Button>}
            </Box>
          </Box>
        </Flex>
      </>}
    </Container>
    <Modal isOpen={storyOpen && !!star} onClose={() => setStoryOpen(false)} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay bg="rgba(6, 29, 38, .72)" />
      <ModalContent mx={4} borderRadius="16px" bg="#FFFDF7" color="#17353B">
        <ModalHeader fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize="2xl" pr={12}>{star?.title}</ModalHeader>
        <ModalCloseButton aria-label="Close story" minW="44px" minH="44px" />
        <ModalBody>
          {star?.image_url && <Image src={star.image_url} alt="" maxH="260px" w="full" objectFit="contain" mb={5} />}
          <Text whiteSpace="pre-wrap" lineHeight="1.8" fontSize={{ base: "md", md: "lg" }}>
            {star?.story_text || "The storyteller kept this memory private. Its star is part of the shared constellation."}
          </Text>
        </ModalBody>
        <ModalFooter><Button onClick={() => setStoryOpen(false)} variant="secondary">Back to the sky</Button></ModalFooter>
      </ModalContent>
    </Modal>
    <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} isCentered><ModalOverlay /><ModalContent borderRadius="24px">
      <ModalHeader>Report a concern</ModalHeader><ModalCloseButton /><ModalBody>
        <Text color="ui.muted" mb={3}>Tell us what needs review. Your report is private.</Text>
        <Textarea value={reason} maxLength={500} minH="130px" onChange={(e) => setReason(e.target.value)} placeholder="What concerns you about this constellation?" />
        {report.isError && <Text color="red.600" role="alert" mt={2}>{String(report.error)}</Text>}
      </ModalBody><ModalFooter><Button onClick={() => report.mutate()} isLoading={report.isPending} isDisabled={reason.trim().length < 10}>Send report</Button></ModalFooter></ModalContent>
    </Modal>
  </Box>
}
