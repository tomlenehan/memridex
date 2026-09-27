import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import {
  FiArrowRight,
  FiCheck,
  FiCompass,
  FiLock,
  FiPlus,
  FiStar,
  FiZap,
} from "react-icons/fi"

import { ConversationsService, type ConversationPublic } from "../../client"

export const Route = createFileRoute("/_layout/conversations")({
  component: ConversationConstellation,
})

const ink = "#17353B"
const muted = "#61777A"
const paper = "#FFFDF5"
const colors = ["#E9A45B", "#67A79A", "#A88BC6", "#E28370", "#6B9FC0"]
const NODE_WIDTH = 218
const COLUMN_GAP = 268
const ROW_GAP = 156

type PositionedNode = {
  node: ConversationPublic
  x: number
  y: number
}

function getNodeStatus(node: ConversationPublic) {
  if (
    node.status === "complete" ||
    node.status === "ready_for_summary" ||
    (node.user_turn_count ?? 0) >= 4
  ) return "complete"
  if (node.status === "active" || (node.parent_conversation_id == null && node.status === "inactive")) return "active"
  return "locked"
}

function statusCopy(node: ConversationPublic) {
  const state = getNodeStatus(node)
  if (state === "complete") return "Path complete"
  if (state === "active") return "In progress"
  return "Path waiting"
}

function getTreeLayout(root: ConversationPublic, nodes: ConversationPublic[]) {
  const children = new Map<number, ConversationPublic[]>()
  for (const node of nodes) {
    const parent = node.parent_conversation_id
    if (parent == null) continue
    const siblings = children.get(parent) ?? []
    siblings.push(node)
    children.set(parent, siblings)
  }

  for (const siblings of children.values()) siblings.sort((a, b) => a.id - b.id)

  let leafIndex = 0
  const positioned: PositionedNode[] = []
  const visit = (node: ConversationPublic, depth: number): number => {
    const descendants = children.get(node.id) ?? []
    let y: number
    if (descendants.length === 0) {
      y = leafIndex * ROW_GAP
      leafIndex += 1
    } else {
      const childRows = descendants.map((child) => visit(child, depth + 1))
      y = (childRows[0] + childRows[childRows.length - 1]) / 2
    }
    positioned.push({ node, x: 54 + depth * COLUMN_GAP, y: 68 + y })
    return y
  }
  visit(root, 0)

  const width = Math.max(720, 54 + (Math.max(...positioned.map((item) => item.node.node_depth ?? 0)) + 1) * COLUMN_GAP + 60)
  const height = Math.max(390, 136 + Math.max(0, leafIndex - 1) * ROW_GAP + 110)
  return { children, height, positioned, width }
}

function groupNodesByRoot(nodes: ConversationPublic[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const grouped = new Map<number, ConversationPublic[]>()
  for (const node of nodes) {
    let root = node
    const seen = new Set<number>()
    while (root.parent_conversation_id != null && !seen.has(root.id)) {
      seen.add(root.id)
      const parent = byId.get(root.parent_conversation_id)
      if (!parent) break
      root = parent
    }
    const cluster = grouped.get(root.id) ?? []
    cluster.push(node)
    grouped.set(root.id, cluster)
  }
  return grouped
}

function ConversationConstellation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const conversationsQuery = useQuery({
    queryKey: ["conversationConstellation"],
    queryFn: () => ConversationsService.readConversations({ limit: 500 }),
  })
  const createNode = useMutation({
    mutationFn: () => ConversationsService.createConversation({ requestBody: {} }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversationConstellation"] })
      await navigate({ to: "/conversation/$conversationId", params: { conversationId: String(conversation.id) } })
    },
  })
  const allNodes = conversationsQuery.data?.data ?? []
  const roots = allNodes.filter((node) => node.parent_conversation_id == null)
  const treeNodesByRoot = useMemo(() => groupNodesByRoot(allNodes), [allNodes])
  const xp = allNodes.reduce((total, node) => {
    const turns = node.user_turn_count ?? 0
    return total + turns * 12 + (getNodeStatus(node) === "complete" ? 28 : 0)
  }, 0)
  const level = Math.floor(xp / 120) + 1
  const completedCount = allNodes.filter((node) => getNodeStatus(node) === "complete").length
  const inProgressCount = allNodes.filter((node) => getNodeStatus(node) === "active").length

  const sortedRoots = useMemo(
    () => [...roots].sort((a, b) => a.id - b.id),
    [roots],
  )

  if (conversationsQuery.isLoading) {
    return (
      <Center minH="60vh" flexDirection="column" gap={4} color={muted}>
        <Spinner color="#4B8D82" size="xl" thickness="3px" />
        <Text>Gathering your story paths…</Text>
      </Center>
    )
  }

  return (
    <Box color={ink} maxW="1500px" mx="auto" pb={{ base: 12, md: 20 }}>
      <Flex
        align={{ base: "stretch", md: "flex-end" }}
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap={6}
        mb={8}
      >
        <Box maxW="680px">
          <HStack spacing={2} color="#4B8D82" mb={3}>
            <Icon as={FiCompass} />
            <Text fontSize="xs" fontWeight="800" letterSpacing="0.16em" textTransform="uppercase">
              Your memory map
            </Text>
          </HStack>
          <Heading
            fontFamily={'"Iowan Old Style", "Palatino Linotype", Georgia, serif'}
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1.08"
            letterSpacing="-0.035em"
          >
            Every memory opens a new path.
          </Heading>
          <Text color={muted} mt={3} fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
            Follow the moments that matter. Your stories will grow into a one-of-a-kind constellation.
          </Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          onClick={() => createNode.mutate()}
          isLoading={createNode.isPending}
          bg="#D98061"
          color="white"
          borderRadius="full"
          px={6}
          h="52px"
          boxShadow="0 8px 20px rgba(153, 84, 56, 0.18)"
          _hover={{ bg: "#C96D50", transform: "translateY(-2px)" }}
          transition="all 180ms ease"
          flexShrink={0}
        >
          Start a story
        </Button>
      </Flex>

      <Flex
        align="center"
        wrap="wrap"
        gap={{ base: 3, md: 5 }}
        mb={8}
        p={{ base: 4, md: 5 }}
        bg="rgba(255,253,245,0.84)"
        border="1px solid #E8E2D3"
        borderRadius="24px"
        boxShadow="0 8px 28px rgba(39,62,61,0.045)"
      >
        <StatPill icon={FiStar} label={`Level ${level}`} value="Story keeper" tone="#E7A64C" />
        <StatPill icon={FiZap} label={`${xp} XP`} value="Memories explored" tone="#D98061" />
        <StatPill icon={FiCheck} label={`${completedCount} complete`} value="Paths finished" tone="#4B8D82" />
        <Box flex="1" minW="180px" ml={{ md: "auto" }}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" fontWeight="700" color={muted}>NEXT LEVEL</Text>
            <Text fontSize="xs" color={muted}>{xp % 120}/120 XP</Text>
          </HStack>
          <Box h="8px" bg="#E8E6DB" borderRadius="full" overflow="hidden">
            <Box h="full" w={`${(xp % 120) / 1.2}%`} bg="linear-gradient(90deg, #E7A64C, #D98061)" borderRadius="full" transition="width 500ms ease" />
          </Box>
        </Box>
      </Flex>

      {conversationsQuery.isError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t load your story map. Try refreshing the page.
        </Alert>
      )}
      {createNode.isError && (
        <Alert status="error" borderRadius="xl" mb={6}>
          <AlertIcon />
          We couldn’t start a new story. Please try again.
        </Alert>
      )}

      {sortedRoots.length === 0 ? (
        <Box
          position="relative"
          overflow="hidden"
          textAlign="center"
          bg={paper}
          border="1px solid #E8E2D3"
          borderRadius="32px"
          py={{ base: 14, md: 20 }}
          px={6}
          boxShadow="0 16px 48px rgba(39,62,61,0.055)"
        >
          <Box position="absolute" top="-42px" right="8%" w="150px" h="150px" borderRadius="full" bg="#F8EBD3" opacity={0.8} />
          <Center position="relative" mx="auto" mb={5} w="76px" h="76px" borderRadius="28px" bg="#E9F1E9" color="#4B8D82" transform="rotate(-6deg)">
            <Icon as={FiCompass} boxSize={8} />
          </Center>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "2xl", md: "3xl" }}>
            Your first story is waiting.
          </Heading>
          <Text color={muted} maxW="470px" mx="auto" mt={3} mb={7} lineHeight="1.7">
            Start with one small moment from childhood. MemriPlace will help you follow the details into new stories.
          </Text>
          <Button
            onClick={() => createNode.mutate()}
            isLoading={createNode.isPending}
            rightIcon={<FiArrowRight />}
            bg="#4B8D82"
            color="white"
            borderRadius="full"
            px={6}
            _hover={{ bg: "#3D786F" }}
          >
            Begin your constellation
          </Button>
        </Box>
      ) : (
        <Stack spacing={7}>
          {sortedRoots.map((root, index) => {
            const treeNodes = treeNodesByRoot.get(root.id) ?? [root]
            const layout = getTreeLayout(root, treeNodes)
            const rootState = getNodeStatus(root)
            return (
              <Box
                key={root.id}
                bg={paper}
                border="1px solid #E8E2D3"
                borderRadius={{ base: "22px", md: "30px" }}
                overflow="hidden"
                boxShadow="0 12px 38px rgba(39,62,61,0.055)"
              >
                <Flex px={{ base: 4, md: 6 }} py={4} align="center" justify="space-between" gap={4} borderBottom="1px solid #EFEADD">
                  <HStack spacing={3} minW={0}>
                    <Center w="42px" h="42px" flexShrink={0} bg={`${colors[index % colors.length]}22`} color={colors[index % colors.length]} borderRadius="15px">
                      <Icon as={FiCompass} boxSize={5} />
                    </Center>
                    <Box minW={0}>
                      <Text fontSize="xs" color={muted} fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">Constellation {String(index + 1).padStart(2, "0")}</Text>
                      <Heading noOfLines={1} size="sm" mt={0.5}>{root.node_title || "A new beginning"}</Heading>
                    </Box>
                  </HStack>
                  <HStack spacing={3} flexShrink={0}>
                    <Text display={{ base: "none", sm: "block" }} fontSize="xs" color={muted}>
                      {(treeNodes.length - 1)} {treeNodes.length === 2 ? "path" : "paths"} discovered
                    </Text>
                    {rootState === "active" && <Badge colorScheme="orange" borderRadius="full" px={3}>In progress</Badge>}
                    {rootState === "complete" && <Badge colorScheme="green" borderRadius="full" px={3}>Growing</Badge>}
                  </HStack>
                </Flex>

                <Box overflowX="auto" overflowY="hidden" sx={{ scrollbarColor: "#D8D2C3 transparent", scrollbarWidth: "thin" }}>
                  <Box position="relative" minW={`${layout.width}px`} h={`${layout.height}px`} bg="radial-gradient(circle at 24px 24px, rgba(75,141,130,.12) 1px, transparent 1.4px)" backgroundSize="28px 28px">
                    <svg
                      aria-hidden="true"
                      width={layout.width}
                      height={layout.height}
                      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
                    >
                      <defs>
                        <linearGradient id={`path-${root.id}`} x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#D8B17C" />
                          <stop offset="100%" stopColor="#71A89B" />
                        </linearGradient>
                      </defs>
                      {layout.positioned.flatMap(({ node, x, y }) => {
                        const descendants = layout.children.get(node.id) ?? []
                        return descendants.map((child) => {
                          const childPosition = layout.positioned.find((item) => item.node.id === child.id)
                          if (!childPosition) return null
                          const startX = x + NODE_WIDTH - 4
                          const endX = childPosition.x + 4
                          const midX = startX + (endX - startX) * 0.5
                          return (
                            <g key={`${node.id}-${child.id}`}>
                              <path d={`M ${startX} ${y + 43} C ${midX} ${y + 43}, ${midX} ${childPosition.y + 43}, ${endX} ${childPosition.y + 43}`} fill="none" stroke="#E2DDCE" strokeWidth="7" strokeLinecap="round" />
                              <path d={`M ${startX} ${y + 43} C ${midX} ${y + 43}, ${midX} ${childPosition.y + 43}, ${endX} ${childPosition.y + 43}`} fill="none" stroke={`url(#path-${root.id})`} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" opacity={getNodeStatus(child) === "locked" ? 0.62 : 1} />
                            </g>
                          )
                        })
                      })}
                    </svg>
                    {layout.positioned.map(({ node, x, y }) => (
                      <StoryNodeCard
                        key={node.id}
                        node={node}
                        x={x}
                        y={y}
                        accent={colors[(index + (node.node_depth ?? 0)) % colors.length]}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Stack>
      )}

      <Flex justify="center" mt={8} color={muted} gap={2} align="center">
        <Icon as={FiZap} color="#D98061" />
        <Text fontSize="sm">{inProgressCount === 1 ? "One story path is ready for you" : `${inProgressCount} story paths ready to continue`}</Text>
      </Flex>
    </Box>
  )
}

function StatPill({ icon, label, value, tone }: { icon: typeof FiStar; label: string; value: string; tone: string }) {
  return (
    <HStack spacing={3} minW={{ base: "calc(50% - 8px)", md: "auto" }}>
      <Center w="40px" h="40px" borderRadius="14px" bg={`${tone}20`} color={tone}>
        <Icon as={icon} boxSize={4} />
      </Center>
      <Box>
        <Text fontWeight="800" fontSize="sm" lineHeight="1.2">{label}</Text>
        <Text fontSize="xs" color={muted} mt={1}>{value}</Text>
      </Box>
    </HStack>
  )
}

function StoryNodeCard({ node, x, y, accent }: { node: ConversationPublic; x: number; y: number; accent: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activate = useMutation({
    mutationFn: () => ConversationsService.activateStoryNode({ id: node.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversationConstellation"] })
      await navigate({ to: "/conversation/$conversationId", params: { conversationId: String(node.id) } })
    },
  })
  const state = getNodeStatus(node)
  const isLocked = state === "locked"
  const isCurrent = state === "active"
  const progress = Math.min(100, Math.round(((node.user_turn_count ?? 0) / 4) * 100))
  const handleOpen = () => {
    if (node.status === "inactive") activate.mutate()
    else void navigate({ to: "/conversation/$conversationId", params: { conversationId: String(node.id) } })
  }

  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      left={`${x}px`}
      top={`${y}px`}
      width={`${NODE_WIDTH}px`}
      minH="88px"
      textAlign="left"
      p={3}
      borderRadius="19px"
      bg={isLocked ? "#F8F6EF" : "white"}
      border="1px solid"
      borderColor={isCurrent ? `${accent}88` : "#E7E2D5"}
      boxShadow={isCurrent ? `0 9px 24px ${accent}25` : "0 6px 17px rgba(38,58,55,0.075)"}
      opacity={isLocked ? 0.82 : 1}
      cursor="pointer"
      transition="transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease"
      _hover={{ transform: "translateY(-4px)", boxShadow: "0 12px 22px rgba(38,58,55,0.12)", opacity: 1 }}
      _focusVisible={{ outline: "3px solid #D98061", outlineOffset: "3px" }}
      onClick={handleOpen}
      aria-label={`${node.node_title || "Story path"}, ${statusCopy(node)}`}
    >
      <Flex align="flex-start" gap={2.5}>
        <Center w="34px" h="34px" flexShrink={0} borderRadius="12px" bg={`${accent}20`} color={accent}>
          <Icon as={isLocked ? FiLock : state === "complete" ? FiCheck : FiStar} boxSize={4} />
        </Center>
        <Box minW={0} flex="1">
          <Text fontWeight="800" fontSize="sm" color={ink} noOfLines={2} lineHeight="1.3">
            {node.node_title || "A remembered moment"}
          </Text>
          <Text fontSize="xs" color={muted} mt={1.5} noOfLines={1}>
            {node.branch_context || statusCopy(node)}
          </Text>
        </Box>
        <Icon as={isLocked ? FiLock : FiArrowRight} color={isLocked ? "#9A9F96" : accent} boxSize={3.5} mt={1} />
      </Flex>
      {isCurrent && (
        <Box mt={3}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="10px" color={muted} fontWeight="700" letterSpacing="0.05em">PATH PROGRESS</Text>
            <Text fontSize="10px" color={accent} fontWeight="800">{node.user_turn_count ?? 0}/4</Text>
          </Flex>
          <Box h="4px" bg="#ECE9DF" borderRadius="full" overflow="hidden">
            <Box w={`${progress}%`} h="full" bg={accent} borderRadius="full" />
          </Box>
        </Box>
      )}
      {activate.isPending && <Flex position="absolute" inset={0} align="center" justify="center" bg="whiteAlpha.800" borderRadius="19px"><Spinner size="sm" color={accent} /></Flex>}
      {activate.isError && <Text fontSize="10px" color="red.500" mt={2}>Could not unlock. Try again.</Text>}
    </Box>
  )
}
