import {
  Box, Button, Flex, Heading, HStack, IconButton, Image, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Stack, Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react"
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiEdit3, FiStar, FiX } from "react-icons/fi"
import { type StoryRelationshipPublic, type StorySummaryPublic } from "../../client"
import NarrationControl from "../Common/NarrationControl"
import { celebrateConnection } from "../../lib/celebration"
import { nightSkyApi, type Constellation } from "../../lib/nightSkyApi"
import "@xyflow/react/dist/style.css"
import "./night-sky.css"

const starColors = ["#F8D881", "#B9DDCF", "#D9C5E6", "#F4C7AF", "#BDDCE9"]
const groupColors = ["#F8D881", "#8ED8BC", "#D9B8F0", "#F5AC91", "#91C9EF", "#F39FB8"]
const groupColor = (id: number) => groupColors[(id - 1) % groupColors.length]

type StarNode = Node<{
  story: StorySummaryPublic
  tint: string
  active: boolean
  picked: boolean
  crafting: boolean
  onChoose: (id: number) => void
}, "star">

function Star({ data }: NodeProps<StarNode>) {
  const title = data.story.title || "A remembered moment"
  return <div className={`sky-node ${data.active ? "active" : ""} ${data.picked ? "picked" : ""}`}>
    <Handle type="target" position={Position.Left} className="sky-node-handle" />
    <button type="button" className="sky-node-hit nodrag nopan"
      aria-label={`${data.crafting ? "Choose" : "Explore"} ${title}`}
      aria-pressed={data.active || data.picked} onClick={() => data.onChoose(data.story.id)} title={title}>
      <span className="sky-node-button" style={{ "--node-tint": data.tint } as CSSProperties}>
        {data.story.image_url ? <img src={data.story.image_url} alt="" /> : <FiStar aria-hidden="true" />}
        <span className="sky-node-spark" aria-hidden="true">✦</span>
      </span>
      <span className="sky-node-title">{title}</span>
    </button>
    <Handle type="source" position={Position.Right} className="sky-node-handle" />
  </div>
}
const nodeTypes = { star: Star }

function layout(stories: StorySummaryPublic[], compact: boolean, narrow: boolean, group?: Constellation) {
  const columns = narrow ? 1 : compact || stories.length <= 4 ? 2 : Math.ceil(Math.sqrt(stories.length * 1.45))
  const members = new Map(group?.members.map((member) => [member.story_id, member]) ?? [])
  return new Map(stories.map((story, i) => [story.id, {
    x: !compact && members.get(story.id)?.x != null ? 70 + members.get(story.id)!.x! * 760
      : compact ? (narrow ? 70 : 30 + (i % columns) * 185)
      : 90 + (i % columns) * 218 + (Math.floor(i / columns) % 2 ? 55 : 0) + Math.sin(story.id * 2.7) * 20,
    y: !compact && members.get(story.id)?.y != null ? 45 + members.get(story.id)!.y! * 420
      : compact ? 72 + Math.floor(i / columns) * 184 + (i % columns ? 24 : 0)
      : 72 + Math.floor(i / columns) * 184 + Math.cos(story.id * 1.9) * 24,
  }]))
}

export default function ConstellationMap({ stories, relationships, groups = [], mode, crafting, onCraftingChange, toolbar, memoryList }: {
  stories: StorySummaryPublic[]
  relationships: StoryRelationshipPublic[]
  groups?: Constellation[]
  mode: "memories" | "constellations"
  crafting: boolean
  onCraftingChange: (crafting: boolean) => void
  toolbar: ReactNode
  memoryList: ReactNode
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [focusedGroupId, setFocusedGroupId] = useState<number | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches)
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 350px)").matches)
  const [wideReader, setWideReader] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)")
    const narrowMedia = window.matchMedia("(max-width: 350px)")
    const readerMedia = window.matchMedia("(min-width: 900px)")
    const update = () => { setCompact(media.matches); setNarrow(narrowMedia.matches); setWideReader(readerMedia.matches) }
    media.addEventListener("change", update)
    narrowMedia.addEventListener("change", update)
    readerMedia.addEventListener("change", update)
    return () => { media.removeEventListener("change", update); narrowMedia.removeEventListener("change", update); readerMedia.removeEventListener("change", update) }
  }, [])
  const queryClient = useQueryClient()
  const selected = stories.find((story) => story.id === selectedId) ?? null
  const focusedGroup = mode === "constellations" ? groups.find((group) => group.id === focusedGroupId) : undefined
  const visibleStories = useMemo(() => focusedGroup
    ? stories.filter((story) => focusedGroup.members.some((member) => member.story_id === story.id))
    : stories, [stories, focusedGroup])
  useEffect(() => {
    if (!crafting) return
    setPicked([])
    setSelectedId(null)
    setFocusedGroupId(null)
  }, [crafting])
  useEffect(() => { setSelectedId(null) }, [mode])
  const selectedIndex = visibleStories.findIndex((story) => story.id === selectedId)
  const stepSelection = (direction: number) => {
    if (selectedIndex < 0 || visibleStories.length < 2) return
    setSelectedId(visibleStories[(selectedIndex + direction + visibleStories.length) % visibleStories.length].id)
  }
  useEffect(() => {
    if (!wideReader || selectedId === null || crafting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null)
        return
      }
      const target = event.target
      if (!(target instanceof Element) || (target !== document.body && !target.closest(".personal-sky")) ||
        target.closest("input, textarea, select, [contenteditable='true']") ||
        selectedIndex < 0 || visibleStories.length < 2 ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return
      event.preventDefault()
      const direction = event.key === "ArrowRight" ? 1 : -1
      setSelectedId(visibleStories[(selectedIndex + direction + visibleStories.length) % visibleStories.length].id)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [wideReader, selectedId, crafting, selectedIndex, visibleStories])
  const guidance = crafting
    ? picked.length === 0
      ? "Select two stars to connect them."
      : picked.length === 1
        ? "Select one more star to continue."
        : `${picked.length} stars chosen. Add more, or name your constellation.`
    : mode === "memories" ? "Select a star to read its memory."
      : focusedGroup ? `${focusedGroup.members.length} connected memories. Select a star to read it.`
        : groups.length ? "Choose a constellation to see its story, or select a star to read a memory."
          : "Create your first constellation by connecting two memories."
  const positions = useMemo(() => layout(visibleStories, compact, narrow, focusedGroup), [visibleStories, compact, narrow, focusedGroup])
  const create = useMutation({
    mutationFn: () => nightSkyApi.create({
      title: name.trim(), overview: "",
      members: picked.map((story_id) => ({ story_id, x: null, y: null, share_story: false, share_image: false })),
      links: picked.slice(1).map((story_b_id, i) => ({ story_a_id: picked[i], story_b_id })),
    }),
    onSuccess: async (group) => {
      setNaming(false); onCraftingChange(false); setPicked([]); setName("")
      setFocusedGroupId(group.id)
      queryClient.setQueryData<Constellation[]>(["constellations"], (current = []) => [...current, group])
      celebrateConnection()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
      ])
    },
  })
  const choose = (id: number) => {
    if (crafting) setPicked((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id])
    else setSelectedId(id)
  }
  const nodes = visibleStories.map((story, i): StarNode => {
    const owningGroup = mode === "constellations" && groups.find((group) => group.members.some((member) => member.story_id === story.id))
    return {
      id: String(story.id), type: "star", position: positions.get(story.id)!, draggable: false, selectable: false,
      style: { pointerEvents: "all" },
      className: selectedId === story.id || picked.includes(story.id) ? "sky-flow-node-selected" : "",
      data: { story, tint: owningGroup ? groupColor(owningGroup.id) : starColors[i % starColors.length],
        active: selectedId === story.id && !crafting, picked: picked.includes(story.id), crafting, onChoose: choose },
    }
  })
  const savedEdges: Edge[] = []
  const seenEdges = new Set<string>()
  if (mode === "constellations") (focusedGroup ? [focusedGroup] : groups).forEach((group) => {
    group.links.forEach((link) => {
      if (!positions.has(link.story_a_id) || !positions.has(link.story_b_id)) return
      const key = [link.story_a_id, link.story_b_id].sort((a, b) => a - b).join("-")
      if (seenEdges.has(key)) return
      seenEdges.add(key)
      const active = selectedId === link.story_a_id || selectedId === link.story_b_id
      savedEdges.push({ id: `saved-${key}`, source: String(link.story_a_id), target: String(link.story_b_id), type: "straight", selectable: false,
        style: { stroke: groupColor(group.id), strokeWidth: active ? 4 : 3, opacity: active ? 1 : .88 } })
    })
  })
  const relatedEdges: Edge[] = mode === "memories" ? relationships.filter((link) => positions.has(link.story_a_id) && positions.has(link.story_b_id)).map((link) => ({
    id: `related-${link.id}`, source: String(link.story_a_id), target: String(link.story_b_id), type: "straight", selectable: false,
    style: { stroke: "#83B5A8", strokeWidth: 1.5, opacity: .42 },
  })) : []
  const draftEdges: Edge[] = crafting ? picked.slice(1).map((id, i) => ({
    id: `draft-${picked[i]}-${id}`, source: String(picked[i]), target: String(id), type: "straight", selectable: false,
    style: { stroke: "#FFE4A3", strokeWidth: 3, strokeDasharray: "5 8" },
  })) : []
  const groupPanel = focusedGroup && !crafting && !selected && <Box as="aside" className="sky-story-panel sky-group-panel" aria-label={`${focusedGroup.title} constellation`}>
    <Flex align="center" justify="space-between" gap={2}>
      <Text className="sky-story-count">SAVED CONSTELLATION</Text>
      <IconButton aria-label="Show all constellations" icon={<FiX />} variant="ghost" onClick={() => setFocusedGroupId(null)} />
    </Flex>
    <Box className="sky-group-panel-symbol" style={{ "--group-color": groupColor(focusedGroup.id) } as CSSProperties}>
      <FiStar aria-hidden="true" />
    </Box>
    <Heading className="sky-story-title" fontFamily={'"Iowan Old Style", Georgia, serif'} size="md" mt={4}>{focusedGroup.title}</Heading>
    {focusedGroup.overview && <Box mt={4}><NarrationControl path={`constellations/${focusedGroup.id}`} /></Box>}
    <Text className="sky-group-panel-overview" whiteSpace="pre-wrap" mt={4}>
      {focusedGroup.overview || "These memories are connected in your private night sky."}
    </Text>
    <Text className="sky-group-panel-label" mt={6}>{focusedGroup.members.length} connected memories</Text>
    <Stack spacing={1} mt={2}>
      {focusedGroup.members.map((member) => <Button key={member.story_id} className="sky-group-memory" variant="ghost"
        justifyContent="flex-start" whiteSpace="normal" textAlign="left" onClick={() => setSelectedId(member.story_id)}>
        <FiStar aria-hidden="true" /> {member.title || "A remembered moment"}
      </Button>)}
    </Stack>
    <Button as={Link} to="/constellation/$constellationId" params={{ constellationId: String(focusedGroup.id) }}
      className="sky-group-edit" variant="outline" leftIcon={<FiEdit3 />} mt="auto">Edit or share</Button>
  </Box>
  const memoryPanel = selected && !crafting && <Box as="aside" className="sky-story-panel" aria-label="Selected memory" aria-live="polite">
    <Flex align="center" justify="space-between" gap={2}>
      <Text className="sky-story-count">Memory {selectedIndex + 1} of {visibleStories.length}</Text>
      <IconButton aria-label="Close memory" icon={<FiX />} variant="ghost" onClick={() => setSelectedId(null)} />
    </Flex>
    <Heading className="sky-story-title" fontFamily={'"Iowan Old Style", Georgia, serif'} size="md" mt={4}>{selected.title || "A remembered moment"}</Heading>
    <Box mt={4}><NarrationControl path={`memories/${selected.id}`} /></Box>
    {selected.image_url && <Image src={selected.image_url} alt="" maxH="180px" w="full" objectFit="contain" mt={5} />}
    <Text className="sky-story-text" whiteSpace="pre-wrap" lineHeight="1.8" mt={5}>{selected.summary_text}</Text>
    <Box className="sky-story-actions">
      <HStack justify="space-between" mb={4}>
        <IconButton aria-label="Previous memory" icon={<FiChevronLeft />} variant="outline" onClick={() => stepSelection(-1)} isDisabled={visibleStories.length < 2} />
        <Text fontSize="sm" color="#61777A">{selectedIndex + 1} / {visibleStories.length}</Text>
        <IconButton aria-label="Next memory" icon={<FiChevronRight />} variant="outline" onClick={() => stepSelection(1)} isDisabled={visibleStories.length < 2} />
      </HStack>
      <Button as={Link} to="/summary/$summaryId" params={{ summaryId: String(selected.id) }} variant="accent" leftIcon={<FiEdit3 />} w="full">Open memory</Button>
    </Box>
  </Box>

  return <Stack spacing={6}>
    <Box className="personal-sky">
      <Box className="personal-sky-header">
        {toolbar}
        <Flex className="sky-header-copy" justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
        <Box><Text className="sky-overline">✦ &nbsp;YOUR PRIVATE NIGHT SKY</Text>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} size="md" color="#FFF9EA" mt={1}>
            {mode === "memories" ? "Your memories, drawn in starlight" : "Your constellations"}
          </Heading>
          <Text color="#D0E2D9" fontSize="md" mt={2} aria-live="polite">{guidance}</Text></Box>
        {crafting ? <HStack w={{ base: "full", md: "auto" }} flexWrap="wrap" spacing={2}>
          <Button className="sky-quiet" size="md" leftIcon={<FiX />} onClick={() => { onCraftingChange(false); setPicked([]) }}>Cancel</Button>
          <Button className="sky-gold" size="md" rightIcon={<FiArrowRight />} onClick={() => setNaming(true)} isDisabled={picked.length < 2}>Name constellation</Button>
        </HStack> : null}
        </Flex>
      </Box>
      {memoryList ? <Box className="sky-memory-list">{memoryList}</Box> : <>
      {mode === "constellations" && groups.length > 0 && <Box className="sky-constellation-bar">
        <Text className="sky-constellation-label">Saved constellations</Text>
        <Select className="sky-constellation-select" aria-label="Saved constellations" display={{ base: "block", md: "none" }}
          style={{ "--group-color": focusedGroup ? groupColor(focusedGroup.id) : "#b6d8c7" } as CSSProperties}
          value={focusedGroup?.id ?? ""} onChange={(event) => { setFocusedGroupId(event.target.value ? Number(event.target.value) : null); setSelectedId(null) }}>
          <option value="">All constellations</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
        </Select>
        <Flex className="sky-constellation-options" display={{ base: "none", md: "flex" }} gap={2} role="group" aria-label="Choose a constellation to explore">
          <Button className="sky-constellation-choice" aria-pressed={!focusedGroup} onClick={() => { setFocusedGroupId(null); setSelectedId(null) }}>
            All constellations
          </Button>
          {groups.map((group) => <Button key={group.id} className="sky-constellation-choice"
            style={{ "--group-color": groupColor(group.id) } as CSSProperties}
            aria-pressed={focusedGroup?.id === group.id}
            onClick={() => { setFocusedGroupId(group.id); setSelectedId(null) }}>
            <Box as="span" className="sky-group-symbol"><FiStar aria-hidden="true" /></Box>
            {group.title}
          </Button>)}
        </Flex>
      </Box>}
      <Flex className="personal-sky-body">
        <Box className="personal-sky-viewport" aria-label="Your personal night sky. Select a star to read its memory. Drag to move and use the zoom controls to explore."
          style={compact ? { height: Math.max(600, 180 + Math.ceil(visibleStories.length / (narrow ? 1 : 2)) * (narrow ? 175 : 135)) } : undefined}>
          <ReactFlow key={`${narrow ? "narrow" : compact ? "compact" : "wide"}-${focusedGroup?.id ?? "all"}-${wideReader && (selected || focusedGroup) && !crafting ? "inspecting" : "browsing"}`}
            nodes={nodes} edges={[...relatedEdges, ...savedEdges, ...draftEdges]} nodeTypes={nodeTypes}
            fitView={!compact && visibleStories.length <= 8} fitViewOptions={{ padding: .25, maxZoom: 1.1 }}
            defaultViewport={compact ? { x: narrow ? 30 : 12, y: 50, zoom: narrow ? .9 : .8 } : { x: 25, y: 45, zoom: .9 }} minZoom={.3} maxZoom={1.8}
            nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
            panOnDrag zoomOnPinch zoomOnScroll={false} zoomOnDoubleClick={false}
            preventScrolling={false} proOptions={{ hideAttribution: true }}>
            <Controls position={compact ? "top-left" : "bottom-right"} showInteractive={false} />
          </ReactFlow>
          <Text className="sky-hint">{crafting ? "Select stars to choose them" : selected ? "Choose another star to read more" : "Select a star to read its memory"}</Text>
        </Box>
        {wideReader && memoryPanel}
        {wideReader && groupPanel}
      </Flex>
      {!wideReader && (memoryPanel || groupPanel)}
      </>}
    </Box>

    <Modal isOpen={naming} onClose={() => setNaming(false)} isCentered><ModalOverlay /><ModalContent borderRadius="26px" mx={4}>
      <ModalHeader>Name your constellation</ModalHeader><ModalCloseButton /><ModalBody>
        <Text color="#617773" mb={3}>These {picked.length} memories will form a private constellation. You can edit its story next.</Text>
        <Box className="sky-picked-list" mb={4}>{picked.map((id) => <Text key={id} noOfLines={1}>✦ {stories.find((story) => story.id === id)?.title || "A remembered moment"}</Text>)}</Box>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="A name for these connected moments" maxLength={120} autoFocus />
        {create.isError && <Text color="red.600" role="alert" mt={3}>We couldn’t save this constellation. Please try again.</Text>}
      </ModalBody><ModalFooter gap={2}><Button variant="ghost" onClick={() => setNaming(false)}>Back</Button>
        <Button className="sheet-primary" onClick={() => create.mutate()} isLoading={create.isPending} isDisabled={!name.trim()}>Save constellation</Button>
      </ModalFooter></ModalContent></Modal>
  </Stack>
}
