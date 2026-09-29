import {
  Box, Button, Flex, Heading, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { FiArrowRight, FiPlus, FiStar, FiX } from "react-icons/fi"
import { type StoryRelationshipPublic, type StorySummaryPublic } from "../../client"
import { celebrateConnection } from "../../lib/celebration"
import { nightSkyApi, type Constellation } from "../../lib/nightSkyApi"
import "@xyflow/react/dist/style.css"
import "./night-sky.css"

const starColors = ["#F8D881", "#B9DDCF", "#D9C5E6", "#F4C7AF", "#BDDCE9"]
const groupColors = ["#F8D881", "#A9D9C7", "#D9C5E6", "#F4C7AF"]

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

function layout(stories: StorySummaryPublic[], compact: boolean, narrow: boolean) {
  const columns = narrow ? 1 : compact || stories.length <= 4 ? 2 : Math.ceil(Math.sqrt(stories.length * 1.45))
  return new Map(stories.map((story, i) => [story.id, {
    x: compact ? (narrow ? 70 : 30 + (i % columns) * 185)
      : 90 + (i % columns) * 218 + (Math.floor(i / columns) % 2 ? 55 : 0) + Math.sin(story.id * 2.7) * 20,
    y: compact ? 72 + Math.floor(i / columns) * 184 + (i % columns ? 24 : 0)
      : 72 + Math.floor(i / columns) * 184 + Math.cos(story.id * 1.9) * 24,
  }]))
}

export default function ConstellationMap({ stories, relationships, groups = [], onAddMemory, isAddingMemory }: {
  stories: StorySummaryPublic[]
  relationships: StoryRelationshipPublic[]
  groups?: Constellation[]
  onAddMemory: () => void
  isAddingMemory: boolean
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [crafting, setCrafting] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState("")
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches)
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 350px)").matches)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)")
    const narrowMedia = window.matchMedia("(max-width: 350px)")
    const update = () => { setCompact(media.matches); setNarrow(narrowMedia.matches) }
    media.addEventListener("change", update)
    narrowMedia.addEventListener("change", update)
    return () => { media.removeEventListener("change", update); narrowMedia.removeEventListener("change", update) }
  }, [])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const selected = stories.find((story) => story.id === selectedId) ?? null
  useEffect(() => {
    if (selectedId === null || crafting) return
    const frame = window.requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId, crafting])
  const guidance = crafting
    ? picked.length === 0
      ? "Tap two stars to connect them."
      : picked.length === 1
        ? "Tap one more star to continue."
        : `${picked.length} stars chosen. Add more, or name your constellation.`
    : stories.length < 2
      ? "Add one more memory to make a constellation."
      : "Tap a star to read its memory, or connect stars into a constellation."
  const positions = useMemo(() => layout(stories, compact, narrow), [stories, compact, narrow])
  const create = useMutation({
    mutationFn: () => nightSkyApi.create({
      title: name.trim(), overview: "",
      members: picked.map((story_id) => ({ story_id, x: null, y: null, share_story: false, share_image: false })),
      links: picked.slice(1).map((story_b_id, i) => ({ story_a_id: picked[i], story_b_id })),
    }),
    onSuccess: async (group) => {
      setNaming(false); setCrafting(false); setPicked([]); setName("")
      celebrateConnection()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["constellations"] }),
        queryClient.invalidateQueries({ queryKey: ["storyRelationships"] }),
      ])
      await navigate({ to: "/constellation/$constellationId", params: { constellationId: String(group.id) } })
    },
  })
  const choose = (id: number) => {
    if (crafting) setPicked((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id])
    else setSelectedId(id)
  }
  const startCrafting = () => { setCrafting(true); setPicked(selectedId === null ? [] : [selectedId]) }
  const nodes = stories.map((story, i): StarNode => ({
    id: String(story.id), type: "star", position: positions.get(story.id)!, draggable: false, selectable: false,
    className: selectedId === story.id || picked.includes(story.id) ? "sky-flow-node-selected" : "",
    data: { story, tint: starColors[i % starColors.length], active: selectedId === story.id && !crafting,
      picked: picked.includes(story.id), crafting, onChoose: choose },
  }))
  const savedEdges: Edge[] = relationships.filter((r) => positions.has(r.story_a_id) && positions.has(r.story_b_id)).map((r) => {
    const groupIndex = groups.findIndex((group) => group.links.some((link) =>
      (link.story_a_id === r.story_a_id && link.story_b_id === r.story_b_id) ||
      (link.story_b_id === r.story_a_id && link.story_a_id === r.story_b_id)))
    const active = selectedId === r.story_a_id || selectedId === r.story_b_id
    return { id: `saved-${r.id}`, source: String(r.story_a_id), target: String(r.story_b_id), type: "straight", selectable: false,
      style: { stroke: groupIndex >= 0 ? groupColors[groupIndex % groupColors.length] : active ? "#FFE4A3" : "#91CABA",
        strokeWidth: active ? 4 : 2.5, opacity: active ? 1 : .78 } }
  })
  const draftEdges: Edge[] = crafting ? picked.slice(1).map((id, i) => ({
    id: `draft-${picked[i]}-${id}`, source: String(picked[i]), target: String(id), type: "straight", selectable: false,
    style: { stroke: "#FFE4A3", strokeWidth: 3, strokeDasharray: "5 8" },
  })) : []

  return <Stack spacing={6}>
    <Box className="personal-sky">
      <Flex className="personal-sky-header" justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
        <Box><Text className="sky-overline">✦ &nbsp;YOUR PRIVATE NIGHT SKY</Text>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} size="md" color="#FFF9EA" mt={1}>Your memories, drawn in starlight</Heading>
          <Text color="#D0E2D9" fontSize="md" mt={2} aria-live="polite">{guidance}</Text></Box>
        {crafting ? <HStack w={{ base: "full", md: "auto" }} flexWrap="wrap" spacing={2}>
          <Button className="sky-quiet" size="md" leftIcon={<FiX />} onClick={() => { setCrafting(false); setPicked([]) }}>Cancel</Button>
          <Button className="sky-gold" size="md" rightIcon={<FiArrowRight />} onClick={() => setNaming(true)} isDisabled={picked.length < 2}>Name constellation</Button>
        </HStack>
          : stories.length < 2
            ? <Button className="sky-gold sky-make" size="md" leftIcon={<FiPlus />} onClick={onAddMemory} isLoading={isAddingMemory}>Add another memory</Button>
            : <Button className="sky-gold sky-make" size="md" leftIcon={<FiPlus />} onClick={startCrafting}>Make a constellation</Button>}
      </Flex>
      <Box className="personal-sky-viewport" aria-label="Your personal night sky. Tap a star to choose it. Drag to move and use the zoom controls to explore.">
        <ReactFlow key={narrow ? "narrow" : compact ? "compact" : "wide"} nodes={nodes} edges={[...savedEdges, ...draftEdges]} nodeTypes={nodeTypes}
          fitView={!compact && stories.length <= 8} fitViewOptions={{ padding: .25, maxZoom: 1.1 }}
          defaultViewport={compact ? { x: narrow ? 30 : 12, y: 50, zoom: narrow ? .9 : .8 } : { x: 25, y: 45, zoom: .9 }} minZoom={.3} maxZoom={1.8}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
          panOnDrag zoomOnPinch zoomOnScroll={false} zoomOnDoubleClick={false}
          preventScrolling={false} proOptions={{ hideAttribution: true }}>
          <Controls position={compact ? "top-left" : "bottom-right"} showInteractive={false} />
        </ReactFlow>
        {!crafting && selected && <Box ref={previewRef} className="sky-preview" role="region" aria-label="Selected memory">
          <Flex align="start" justify="space-between" gap={3}>
            <Box minW={0}>
              <Text className="sky-preview-label">YOUR MEMORY</Text>
              <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} size="sm" mt={1} noOfLines={2}>{selected.title || "A remembered moment"}</Heading>
            </Box>
            <IconButton aria-label="Close memory preview" icon={<FiX size={20} />} className="sky-preview-close" color="#FFF9E9" _hover={{ bg: "#285461" }} onClick={() => setSelectedId(null)} variant="ghost" />
          </Flex>
          <Text className="sky-preview-summary" noOfLines={2} mt={2}>{selected.summary_text}</Text>
          <Button as={Link} to="/summary/$summaryId" params={{ summaryId: String(selected.id) }} className="sky-preview-open" rightIcon={<FiArrowRight />} mt={3}>Read this memory</Button>
        </Box>}
        {!selected && <Text className="sky-hint">{crafting ? "Tap stars to choose them" : "Tap a star to see its memory"}</Text>}
      </Box>
    </Box>

    {groups.length > 0 && <Box><Text className="sheet-overline">SHAPES YOU'VE SAVED</Text><Heading size="md" mb={3} mt={1}>Your constellations</Heading>
      <Flex gap={3} overflowX="auto" pb={2} sx={{ scrollbarWidth: "thin" }}>{groups.map((group, i) =>
        <Flex key={group.id} as={Link} to="/constellation/$constellationId" params={{ constellationId: String(group.id) }} className="sky-group" flexShrink={0}>
          <Box className="sky-group-stars" color={groupColors[i % groupColors.length]}><FiStar /><FiStar /><FiStar /></Box>
          <Box flex="1" minW={0}><Text fontWeight="800" noOfLines={2}>{group.title}</Text><Text color="#68807A" fontSize="sm">{group.members.length} connected stars</Text></Box><FiArrowRight color="#527D70" /></Flex>)}</Flex>
    </Box>}

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
