import {
  Alert, AlertIcon, Box, Button, Checkbox, Container, Flex, FormControl,
  FormLabel, Heading, HStack, Image, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner,
  Stack, Text, Textarea,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { FiArrowLeft, FiEdit3, FiGlobe, FiStar } from "react-icons/fi"
import { SummariesService } from "../../../client"
import { PUBLIC_SKY_ENABLED } from "../../../config"
import ConstellationStar from "../../../components/Common/ConstellationStar"
import SkyScene from "../../../components/MemoryMap/SkyScene"
import useAuth from "../../../hooks/useAuth"
import { celebrateConnection } from "../../../lib/celebration"
import { nightSkyApi, type ConstellationWrite, type Member, type PublicConstellation } from "../../../lib/nightSkyApi"

export const Route = createFileRoute("/_layout/constellation/$constellationId")({ component: ConstellationEditor })

function ConstellationEditor() {
  const { constellationId } = Route.useParams()
  const id = Number(constellationId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const groupQuery = useQuery({ queryKey: ["constellation", id], queryFn: () => nightSkyApi.get(id), enabled: Number.isInteger(id) && id > 0 })
  const storiesQuery = useQuery({ queryKey: ["summaries"], queryFn: () => SummariesService.readStorySummaries({ limit: 100 }) })
  const [title, setTitle] = useState("")
  const [overview, setOverview] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [links, setLinks] = useState<{ story_a_id: number; story_b_id: number }[]>([])
  const [linking, setLinking] = useState(false)
  const [linkAnchor, setLinkAnchor] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(0)
  const [storyOpen, setStoryOpen] = useState(false)
  const [authorName, setAuthorName] = useState("")
  const [proposal, setProposal] = useState<string | null>(null)
  const [proposalHash, setProposalHash] = useState<string | null>(null)
  const [sourceHash, setSourceHash] = useState<string | null>(null)
  const [preview, setPreview] = useState<PublicConstellation | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!groupQuery.data) return
    setTitle(groupQuery.data.title)
    setOverview(groupQuery.data.overview)
    setMembers(groupQuery.data.members)
    setLinks(groupQuery.data.links)
    setSourceHash(groupQuery.data.source_hash)
    setSelected(0)
    setDirty(false)
  }, [groupQuery.data])
  useEffect(() => {
    if (user?.full_name && !authorName) setAuthorName(user.full_name)
  }, [user?.full_name])

  const save = useMutation({
    mutationFn: () => {
      const body: ConstellationWrite = {
        title: title.trim(), overview: overview.trim(),
        source_hash: sourceHash,
        members: members.map(({ story_id, x, y, share_story, share_image }) => ({ story_id, x, y, share_story, share_image })),
        links,
      }
      return nightSkyApi.update(id, body)
    },
    onSuccess: async (updated) => {
      setDirty(false)
      queryClient.setQueryData(["constellation", id], updated)
      await queryClient.invalidateQueries({ queryKey: ["constellations"] })
    },
  })
  const generate = useMutation({ mutationFn: (refresh: boolean) => nightSkyApi.proposeOverview(id, refresh), onSuccess: (data) => { setProposal(data.overview); setProposalHash(data.source_hash) } })
  const previewMutation = useMutation({ mutationFn: () => nightSkyApi.preview(id, authorName.trim()), onSuccess: setPreview })
  const publish = useMutation({
    mutationFn: () => nightSkyApi.publish(id, authorName.trim(), preview!.preview_token!),
    onSuccess: async (result) => {
      setPreview(null)
      celebrateConnection()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellation", id] }),
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
      ])
      if (result.id) await navigate({ to: "/night-sky/$publicationId", params: { publicationId: String(result.id) } })
    },
  })
  const unpublish = useMutation({ mutationFn: () => nightSkyApi.unpublish(id), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["constellation", id] })
  } })
  const remove = useMutation({ mutationFn: () => nightSkyApi.remove(id), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["constellations"] })
    await navigate({ to: "/conversations" })
  } })

  const choose = (index: number, openStory = false) => {
    setSelected(index)
    if (!linking) {
      if (openStory) setStoryOpen(true)
      return
    }
    const storyId = members[index].story_id
    if (linkAnchor == null) { setLinkAnchor(storyId); return }
    if (linkAnchor !== storyId && !links.some((link) =>
      (link.story_a_id === linkAnchor && link.story_b_id === storyId) ||
      (link.story_b_id === linkAnchor && link.story_a_id === storyId),
    )) {
      setLinks((current) => [...current, { story_a_id: linkAnchor, story_b_id: storyId }])
      setDirty(true)
    }
    setLinkAnchor(null)
    setLinking(false)
  }
  const canRemoveLink = (index: number) => {
    const remaining = links.filter((_, i) => i !== index)
    const reached = new Set([members[0]?.story_id])
    let changed = true
    while (changed) {
      changed = false
      for (const link of remaining) {
        if (reached.has(link.story_a_id) && !reached.has(link.story_b_id)) { reached.add(link.story_b_id); changed = true }
        if (reached.has(link.story_b_id) && !reached.has(link.story_a_id)) { reached.add(link.story_a_id); changed = true }
      }
    }
    return reached.size === members.length
  }
  const member = selected == null ? undefined : members[selected]
  const changeMember = (index: number, changes: Partial<Member>) => {
    setMembers((current) => current.map((item, i) => i === index ? { ...item, ...changes } : item))
    setDirty(true)
  }
  const addStory = (value: string) => {
    const story = storiesQuery.data?.find((item) => item.id === Number(value))
    if (!story || members.some((item) => item.story_id === story.id)) return
    setMembers((current) => [...current, {
      story_id: story.id, title: story.title || "A remembered moment", summary_text: story.summary_text,
      image_url: story.image_url ?? null, x: null, y: null, share_story: false, share_image: false,
    }])
    if (members.length > 0) setLinks((current) => [...current, { story_a_id: members[members.length - 1].story_id, story_b_id: story.id }])
    setSelected(members.length)
    setDirty(true)
    setSourceHash(null)
  }
  const removeMember = (index: number) => {
    if (members.length <= 2) return
    setMembers((current) => current.filter((_, i) => i !== index))
    const remaining = members.filter((_, i) => i !== index)
    setLinks(remaining.slice(1).map((item, i) => ({ story_a_id: remaining[i].story_id, story_b_id: item.story_id })))
    setSelected(0)
    setDirty(true)
    setSourceHash(null)
  }
  const moveMember = (index: number, by: number) => {
    const next = [...members]
    const destination = index + by
    if (destination < 0 || destination >= next.length) return
    ;[next[index], next[destination]] = [next[destination], next[index]]
    setMembers(next)
    setSelected(destination)
    setDirty(true)
    setSourceHash(null)
  }
  const moveStar = (dx: number, dy: number) => {
    if (selected == null || !members[selected]) return
    const columns = Math.max(2, Math.ceil(Math.sqrt(members.length * 1.4)))
    const item = members[selected]
    const x = item.x ?? (80 + (selected % columns) * 215 + (Math.floor(selected / columns) % 2 ? 45 : 0) - 70) / 760
    const y = item.y ?? (55 + Math.floor(selected / columns) * 185 + (selected % 2 ? 24 : 0) - 45) / 480
    changeMember(selected, { x: Math.max(.02, Math.min(.95, x + dx)), y: Math.max(.02, Math.min(.95, y + dy)) })
  }

  if (groupQuery.isLoading) return <Flex minH="55vh" align="center" justify="center"><Spinner size="xl" color="#4B8D82" /></Flex>
  if (groupQuery.isError || !groupQuery.data) return <Alert status="error" borderRadius="xl"><AlertIcon />Couldn’t open this constellation.</Alert>

  return <Container maxW="6xl" pb={16} px={{ base: 0, md: 4 }}>
    <Button as={Link} to="/conversations" variant="ghost" leftIcon={<FiArrowLeft />} mb={5}>My night sky</Button>
    <Flex bg="#F1F5E8" p={{ base: 5, md: 8 }} borderRadius="28px" align="center" gap={4} mb={6}>
      <ConstellationStar boxSize={{ base: "80px", md: "110px" }} />
      <Box><Text color="#63816C" fontSize="xs" fontWeight="800" letterSpacing=".1em">YOUR PRIVATE CONSTELLATION</Text>
        <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "2xl", md: "4xl" }} mt={1}>{groupQuery.data.title}</Heading>
        <Text color="ui.muted" mt={2}>{members.length} memories, one shape only you could make.</Text>
      </Box>
    </Flex>
    <Flex mb={3} justify="space-between" gap={3} align="center" flexWrap="wrap">
      <Text color="ui.muted" fontSize="sm">{linking ? "Tap the second star to add a connection." : "Tap a star to explore it. Drag the sky to look around."}</Text>
      {linking && <Button size="sm" variant="outline" onClick={() => { setLinking(false); setLinkAnchor(null) }}>Cancel connection</Button>}
    </Flex>
    <SkyScene stars={members} links={links.map((link) => ({ a: members.findIndex((item) => item.story_id === link.story_a_id), b: members.findIndex((item) => item.story_id === link.story_b_id) }))}
      selected={selected} onSelect={(index) => choose(index, true)} label="Your private constellation" />
    {member && <Flex bg="#FFFDF7" border="1px solid #DFE9DA" borderRadius="22px" mt={3} p={{ base: 4, md: 5 }} align={{ base: "start", md: "center" }} justify="space-between" gap={4} direction={{ base: "column", md: "row" }}>
      <Box><Text color="#4F8679" fontSize="xs" fontWeight="800" letterSpacing=".1em">SELECTED STAR</Text>
        <Heading size="sm" mt={1}>{member.title}</Heading><Text fontSize="sm" color="ui.muted" noOfLines={2} mt={1}>{member.summary_text}</Text></Box>
      <HStack flexShrink={0} flexWrap="wrap"><Button size="sm" variant="secondary" onClick={() => { setLinking(true); setLinkAnchor(member.story_id) }} isDisabled={linking}>Connect this star</Button>
        {dirty && <Button size="sm" variant="accent" onClick={() => save.mutate()} isLoading={save.isPending}>Save draft</Button>}</HStack>
    </Flex>}
    <Flex gap={2} flexWrap="wrap" mt={3}>
      {links.map((link, index) => <Button key={`${link.story_a_id}-${link.story_b_id}`} size="xs" variant="outline" isDisabled={!canRemoveLink(index)}
        onClick={() => { setLinks((current) => current.filter((_, i) => i !== index)); setDirty(true) }}>
        {members.find((item) => item.story_id === link.story_a_id)?.title} ↔ {members.find((item) => item.story_id === link.story_b_id)?.title} · remove
      </Button>)}
    </Flex>
    <Flex direction={{ base: "column", lg: "row" }} gap={6} mt={6} align="start">
      <Box flex="1" w="full" bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={{ base: 5, md: 7 }}>
        <HStack mb={5}><FiEdit3 color="#4B8D82" /><Heading size="md">The story these stars tell</Heading></HStack>
        <FormControl><FormLabel>Constellation name</FormLabel><Input value={title} maxLength={120} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} /></FormControl>
        <FormControl mt={5}><FormLabel>Overview</FormLabel><Textarea value={overview} minH="230px" maxLength={12000} lineHeight="1.8"
          placeholder="What thread connects these memories? Add your own words, or ask for a draft."
          onChange={(e) => { setOverview(e.target.value); setDirty(true) }} /></FormControl>
        <Button mt={3} size="sm" variant="outline" leftIcon={<FiStar />} onClick={() => generate.mutate(false)} isLoading={generate.isPending} isDisabled={dirty}>Suggest an overview</Button>
        <Text color="ui.muted" fontSize="xs" mt={2}>Uses the current saved text of these memories. Your edits stay yours until you choose to replace them.</Text>
        {dirty && <Text color="#876B32" fontSize="xs" mt={1}>Save changes to the shape before requesting a new overview.</Text>}
        {generate.isError && <Text color="red.600" role="alert" mt={3}>{String(generate.error)}</Text>}
        {proposal && <Box mt={4} p={4} borderRadius="xl" bg="#F6F7EC" border="1px solid #DCE7D5">
          <Text fontSize="xs" fontWeight="800" color="#63816C" mb={2}>PROPOSED DRAFT</Text><Text whiteSpace="pre-wrap">{proposal}</Text>
          <HStack mt={3}><Button size="sm" onClick={() => { setOverview(proposal); setSourceHash(proposalHash); setProposal(null); setDirty(true) }}>Use this draft</Button>
            <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>Keep my writing</Button>
            <Button size="sm" variant="ghost" onClick={() => generate.mutate(true)} isLoading={generate.isPending}>Try another</Button></HStack>
        </Box>}
        <Flex mt={6} gap={3} flexWrap="wrap" align="center"><Button variant="primary" onClick={() => save.mutate()} isLoading={save.isPending} isDisabled={!dirty || !title.trim() || members.length < 2}>Save draft</Button>
          {save.isSuccess && !dirty && <Text color="#39725C" fontSize="sm">Saved privately</Text>}
          {save.isError && <Text color="red.600" role="alert">{String(save.error)}</Text>}</Flex>
      </Box>
      <Stack w={{ base: "full", lg: "340px" }} spacing={5}>
        <Box bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={5}>
          <Heading size="sm" mb={3}>Memories in this shape</Heading>
          {members.map((item, i) => <Button key={item.story_id} variant={selected === i ? "secondary" : "ghost"} w="full" justifyContent="start" mb={2} leftIcon={<FiStar />} onClick={() => choose(i)} noOfLines={1}>{item.title}</Button>)}
          <Select placeholder="Add a saved memory" value="" onChange={(e) => addStory(e.target.value)} mt={3}>
            {(storiesQuery.data ?? []).filter((story) => !members.some((item) => item.story_id === story.id)).map((story) =>
              <option key={story.id} value={story.id}>{story.title || "A remembered moment"}</option>) }
          </Select>
        </Box>
        {member && <Box bg="white" border="1px solid #E2E9DB" borderRadius="24px" p={5}>
          <Text color="#63816C" fontSize="xs" fontWeight="800" textTransform="uppercase">Selected star</Text>
          <Heading size="sm" mt={2}>{member.title}</Heading><Text mt={3} color="ui.muted" noOfLines={5}>{member.summary_text}</Text>
          {member.image_url && <Image src={member.image_url} alt="Memory illustration" mt={4} borderRadius="lg" maxH="140px" objectFit="cover" />}
          <HStack mt={4}><Button size="xs" onClick={() => moveMember(selected!, -1)} isDisabled={selected === 0}>Move earlier</Button>
            <Button size="xs" onClick={() => moveMember(selected!, 1)} isDisabled={selected === members.length - 1}>Move later</Button></HStack>
          <Text fontSize="xs" color="ui.muted" mt={4}>Place this star in the sky</Text>
          <HStack mt={2} flexWrap="wrap"><Button size="xs" onClick={() => moveStar(0, -.05)}>↑</Button>
            <Button size="xs" onClick={() => moveStar(-.05, 0)}>←</Button>
            <Button size="xs" onClick={() => moveStar(.05, 0)}>→</Button>
            <Button size="xs" onClick={() => moveStar(0, .05)}>↓</Button></HStack>
          <Button size="xs" colorScheme="red" variant="ghost" mt={2} onClick={() => removeMember(selected!)} isDisabled={members.length <= 2}>Remove from shape</Button>
          {PUBLIC_SKY_ENABLED && <Box mt={5} borderTop="1px solid #E2E9DB" pt={4}>
            <Text fontWeight="800" fontSize="sm" mb={3}>If you publish this constellation</Text>
            <Checkbox isChecked={member.share_story} onChange={(e) => changeMember(selected!, { share_story: e.target.checked })}>Let readers open this story</Checkbox>
            <Checkbox display="block" mt={3} isChecked={member.share_image} isDisabled={!member.image_url} onChange={(e) => changeMember(selected!, { share_image: e.target.checked })}>Include this image</Checkbox>
            <Text color="ui.muted" fontSize="xs" mt={3}>Its original conversation and voice transcript always stay private.</Text>
          </Box>}
        </Box>}
      </Stack>
    </Flex>
    {PUBLIC_SKY_ENABLED && <Box mt={8} bg="#EAF2E8" borderRadius="24px" p={{ base: 5, md: 7 }}>
      <HStack mb={2}><FiGlobe color="#4B8D82" /><Heading size="md">Share with the Global Night Sky</Heading></HStack>
      <Text color="ui.muted" mb={5}>Preview exactly what readers will see. Story text and images are included only when you select them above.</Text>
      <FormControl maxW="350px"><FormLabel>Public display name or pseudonym</FormLabel><Input value={authorName} maxLength={60} onChange={(e) => setAuthorName(e.target.value)} placeholder="How should readers know you?" /></FormControl>
      <HStack mt={4} flexWrap="wrap"><Button onClick={() => previewMutation.mutate()} isLoading={previewMutation.isPending}
        isDisabled={dirty || !overview.trim() || !authorName.trim()} variant="accent">Preview public version</Button>
        {groupQuery.data.publication_id && <Button variant="outline" colorScheme="red" onClick={() => unpublish.mutate()} isLoading={unpublish.isPending}>Remove from public sky</Button>}</HStack>
      {dirty && <Text color="#876B32" mt={2} fontSize="sm">Save your draft before previewing it.</Text>}
      {previewMutation.isError && <Text color="red.600" role="alert" mt={3}>{String(previewMutation.error)}</Text>}
      {unpublish.isError && <Text color="red.600" role="alert" mt={3}>{String(unpublish.error)}</Text>}
    </Box>}
    <Button colorScheme="red" variant="ghost" mt={8} onClick={() => { if (window.confirm("Delete this private constellation? Its memories will stay in your night sky.")) remove.mutate() }} isLoading={remove.isPending}>Delete constellation</Button>
    <Modal isOpen={storyOpen && !!member} onClose={() => setStoryOpen(false)} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(6, 29, 38, .72)" /><ModalContent mx={4} borderRadius="16px" bg="#FFFDF7" color="#17353B">
        <ModalHeader fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize="2xl" pr={12}>{member?.title}</ModalHeader><ModalCloseButton aria-label="Close memory" minW="44px" minH="44px" />
        <ModalBody>
          {member?.image_url && <Image src={member.image_url} alt="" maxH="260px" w="full" objectFit="contain" mb={5} />}
          <Text whiteSpace="pre-wrap" lineHeight="1.8" fontSize={{ base: "md", md: "lg" }}>{member?.summary_text}</Text>
        </ModalBody>
        <ModalFooter justifyContent="flex-start">
          {member && <Button as={Link} to="/summary/$summaryId" params={{ summaryId: String(member.story_id) }} onClick={() => setStoryOpen(false)} variant="accent" leftIcon={<FiEdit3 />}>Open memory</Button>}
        </ModalFooter>
      </ModalContent>
    </Modal>
    <Modal isOpen={!!preview} onClose={() => setPreview(null)} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay /><ModalContent borderRadius="24px"><ModalHeader>Exactly what readers will see</ModalHeader><ModalCloseButton />
        <ModalBody>{preview && <Stack spacing={4}>
          <Text color="#63816C" fontWeight="800">{preview.author_name} · Level {preview.author_level} · {preview.stars.length} stars</Text>
          <Heading size="lg">{preview.title}</Heading><Text whiteSpace="pre-wrap">{preview.overview}</Text>
          <SkyScene stars={preview.stars} links={preview.links} selected={selected} onSelect={setSelected} label="Exact public constellation layout" />
          {preview.stars.map((star) => <Box key={star.index} p={4} border="1px solid #E2E9DB" borderRadius="xl">
            <Heading size="sm">{star.title}</Heading>
            {star.story_text ? <Text mt={2}>{star.story_text}</Text> : <Text mt={2} color="ui.muted" fontSize="sm">Story text stays private</Text>}
            {star.image_url && <Image mt={3} src={star.image_url} alt={star.title} maxH="180px" objectFit="cover" borderRadius="lg" />}
          </Box>)}
          <Text fontSize="xs" color="ui.muted">Conversations, voice transcripts, contacts, and other memories are never included.</Text>
          {publish.isError && <Alert status="error" borderRadius="xl"><AlertIcon />{String(publish.error)}</Alert>}
        </Stack>}</ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={() => setPreview(null)}>Keep private</Button>
          <Button variant="accent" onClick={() => publish.mutate()} isLoading={publish.isPending} isDisabled={!preview?.preview_token}>
            {groupQuery.data.publication_id ? "Update published version" : "Publish to public sky"}
          </Button></ModalFooter></ModalContent>
    </Modal>
  </Container>
}
