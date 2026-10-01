import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  Image,
  Select,
  Spinner,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Controls, type Node, type NodeProps, ReactFlow } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useEffect, useState } from "react"
import { FiArrowRight, FiList, FiStar } from "react-icons/fi"
import memriPlaceMark from "../assets/images/MemriPlaceLighterLogo.png"
import AppHeader from "../components/Common/AppHeader"
import NightSkyPageHeader from "../components/MemoryMap/NightSkyPageHeader"
import { type SkyCluster, nightSkyApi } from "../lib/nightSkyApi"
import "./public-night-sky.css"

export const Route = createFileRoute("/night-sky/")({ component: PublicSky })

function PublicSky() {
  const [sort, setSort] = useState<"recent" | "celebrated">("recent")
  const [view, setView] = useState<"sky" | "list">("sky")
  const [page, setPage] = useState(0)
  const signedIn =
    typeof window !== "undefined" &&
    !!window.localStorage.getItem("access_token")
  const query = useQuery({
    queryKey: ["publicSky", sort, page],
    queryFn: () => nightSkyApi.browse(sort, page * 24),
  })
  const data = query.data?.data ?? []
  const hasSharedStories = query.isSuccess && (query.data?.count ?? 0) > 0
  return (
    <Box minH="100vh" bg="#FFFDF5" color="#17353B">
      {signedIn ? <AppHeader /> : <Flex
        as="header"
        align="center"
        justify="space-between"
        gap={4}
        px={{ base: 5, md: 10 }}
        py={4}
        bg="#FFFDF5"
      >
        <HStack as={Link} to="/landing" spacing={3}>
          <Image
            src={memriPlaceMark}
            alt="MemriPlace"
            boxSize="48px"
            objectFit="contain"
          />
          <Text fontWeight="800">MemriPlace</Text>
        </HStack>
        <HStack>
          <Button
            as={Link}
            to="/landing"
            variant="ghost"
            size="sm"
            display={{ base: "none", sm: "inline-flex" }}
          >
            Home
          </Button>
          <Button
            as={Link}
            to={signedIn ? "/conversations" : "/login"}
            variant="secondary"
            size="sm"
          >
            {signedIn ? "My night sky" : "Log in"}
          </Button>
        </HStack>
      </Flex>}
      <Box as="main" w="full" px={{ base: 4, sm: 6, md: 8 }} py={{ base: 6, md: 8 }}>
        <Box maxW="1280px" mx="auto" pb={{ base: 12, md: 20 }}>
          <NightSkyPageHeader
            title="Global Night Sky"
            description="Constellations people have chosen to share."
          />
          <Box className="public-night-sky" color="#FFF9E8">
            <Box className="public-night-sky-header">
              <Flex className="public-sky-header-copy" justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
                <Box>
                  <Text className="public-sky-overline">✦ &nbsp;THE SHARED NIGHT SKY</Text>
                  <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} size="md" color="#FFF9EA" mt={1}>
                    Stories shared in starlight
                  </Heading>
                  <Text color="#D0E2D9" fontSize="md" mt={2}>
                    {query.isSuccess && !hasSharedStories
                      ? "Shared constellations will appear here."
                      : "Select a constellation to explore its memories."}
                  </Text>
                </Box>
                <HStack className="public-sky-header-actions" spacing={2}>
                  <Select
                    className="public-sky-sort-select"
                    aria-label="Sort constellations"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as "recent" | "celebrated")
                      setPage(0)
                    }}
                  >
                    <option value="recent">Recently shared</option>
                    <option value="celebrated">Most celebrated</option>
                  </Select>
                  <Button className="public-sky-list-toggle" size="md" variant="ghost" leftIcon={<FiList />}
                    isDisabled={!hasSharedStories} onClick={() => setView(view === "sky" ? "list" : "sky")}>
                    {view === "sky" ? "View as list" : "Back to sky"}
                  </Button>
                </HStack>
              </Flex>
            </Box>
            <Box className="public-sky-content">
          {query.isLoading && (
            <Flex minH="300px" align="center" justify="center">
              <Spinner size="xl" color="#F5D785" />
            </Flex>
          )}
          {query.isError && (
            <Alert status="info" borderRadius="2xl" color="#17353B">
              <AlertIcon />
              The Global Night Sky is being prepared. Your private sky is still
              here when you sign in.
            </Alert>
          )}
          {query.isSuccess && !hasSharedStories && (
            <Flex
              minH="320px"
              direction="column"
              align="center"
              justify="center"
              textAlign="center"
              gap={3}
            >
              <Icon as={FiStar} boxSize={12} color="#F5D785" />
              <Heading size="md">A quiet sky, for now.</Heading>
              <Text color="#D4E7DF">
                Start with a memory in your own private night sky.
              </Text>
              <Button
                as={Link}
                to={signedIn ? "/conversations" : "/signup"}
                variant="accent"
                size="lg"
                rightIcon={<FiArrowRight />}
                mt={3}
              >
                {signedIn ? "Go to my night sky" : "Start your night sky"}
              </Button>
            </Flex>
          )}
          {query.isSuccess &&
            data.length > 0 &&
            (view === "sky" ? (
              <PublicSkyCanvas data={data} />
            ) : (
              <Box className="public-sky-list" p={{ base: 4, md: 7 }}>
                {data.map((item) => (
                  <Flex
                    key={item.id}
                    as={Link}
                    to="/night-sky/$publicationId"
                    params={{ publicationId: String(item.id) }}
                    borderBottom="1px solid #3C6166"
                    py={4}
                    gap={4}
                    align="center"
                    _hover={{ bg: "#214C55" }}
                    borderRadius="lg"
                    px={3}
                  >
                    <Icon as={FiStar} color="#F5D785" boxSize={6} />
                    <Box flex="1">
                      <Text fontWeight="800">{item.title}</Text>
                      <Text fontSize="sm" color="#BED8CF">
                        {item.author_name} · Level {item.author_level} ·{" "}
                        {item.star_count} stars · {item.votes} celebrations
                      </Text>
                    </Box>
                    <FiArrowRight />
                  </Flex>
                ))}
              </Box>
            ))}
          {query.isSuccess && query.data && query.data.count > 24 && (
            <HStack className="public-sky-pagination" justify="center">
              <Button
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                isDisabled={page === 0}
              >
                Previous
              </Button>
              <Text fontSize="sm">
                {page + 1} of {Math.ceil(query.data.count / 24)}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage(page + 1)}
                isDisabled={(page + 1) * 24 >= query.data.count}
              >
                Next
              </Button>
            </HStack>
          )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

type ClusterNode = Node<{ item: SkyCluster }, "cluster">
function ClusterNodeView({ data }: NodeProps<ClusterNode>) {
  return <Cluster item={data.item} />
}
const clusterNodeTypes = { cluster: ClusterNodeView }

function PublicSkyCanvas({ data }: { data: SkyCluster[] }) {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 600px)").matches,
  )
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)")
    const update = () => setCompact(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const columns = Math.max(2, Math.ceil(Math.sqrt(data.length * 1.5)))
  const nodes: ClusterNode[] = data.map((item, index) => ({
    id: String(item.id),
    type: "cluster",
    draggable: false,
    selectable: false,
    style: { pointerEvents: "all" },
    position: {
      x:
        40 +
        (index % columns) * 345 +
        (Math.floor(index / columns) % 2 ? 90 : 0) +
        Math.sin(item.id * 1.7) * 24,
      y: 45 + Math.floor(index / columns) * 350 + Math.cos(item.id * 2.3) * 22,
    },
    data: { item },
  }))
  return (
    <Box
      className="public-sky-viewport"
      aria-label="Global Night Sky. Drag to discover shared constellations and open one to read its stories."
    >
      <ReactFlow
        key={compact ? "compact" : "wide"}
        nodes={nodes}
        edges={[]}
        nodeTypes={clusterNodeTypes}
        fitView={!compact && data.length <= 2}
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        defaultViewport={
          compact ? { x: 15, y: 65, zoom: 0.9 } : { x: 35, y: 40, zoom: 0.9 }
        }
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnPinch
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          position={compact ? "top-left" : "bottom-right"}
          showInteractive={false}
        />
      </ReactFlow>
      <Text className="public-sky-hint">
        Drag to explore · Tap a constellation to open it
      </Text>
    </Box>
  )
}

function Cluster({ item }: { item: SkyCluster }) {
  const authorName = item.author_name.replace(/\s*\[Demo\]\s*$/, "")
  const glow = Math.min(28, 5 + Math.log2(item.votes + 1) * 5)
  const points = (item.preview_stars ?? []).map((point) => ({
    x: 25 + Math.max(0, Math.min(1, point.x)) * 210,
    y: 17 + Math.max(0, Math.min(1, point.y)) * 78,
  }))
  const palette = [
    "#F7D987",
    "#B9DDCF",
    "#D8C9E6",
    "#F2C6AE",
    "#BDDCE9",
    "#E4D991",
  ]
  return (
    <Flex
      as={Link}
      to="/night-sky/$publicationId"
      params={{ publicationId: String(item.id) }}
      className="public-cluster nodrag nopan"
      direction="column"
      style={{ boxShadow: `0 0 ${glow}px rgba(247, 217, 135, .28)` }}
    >
      <HStack className="public-cluster-author" spacing={2}>
        <Avatar name={authorName} size="sm" bg="#DDE5D9" color="#17353B" />
        <Text noOfLines={1}>{authorName}</Text>
      </HStack>
      <Box className="public-cluster-art" aria-hidden="true">
        <svg
          aria-hidden="true"
          viewBox="0 0 260 115"
          preserveAspectRatio="xMidYMid meet"
        >
          {(item.preview_links ?? []).map(
            ({ a, b }, index) =>
              points[a] &&
              points[b] && (
                <line
                  key={`${a}-${b}-${index}`}
                  x1={points[a].x}
                  y1={points[a].y}
                  x2={points[b].x}
                  y2={points[b].y}
                  stroke="#A6D6C5"
                  strokeWidth="2"
                  opacity=".78"
                />
              ),
          )}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x - 13}
              y={point.y + 11}
              fontSize="31"
              fill={palette[index % palette.length]}
            >
              ★
            </text>
          ))}
        </svg>
      </Box>
      <Text className="public-cluster-eyebrow">
        {item.star_count} STORIES · LEVEL {item.author_level}
      </Text>
      <Heading
        size="md"
        fontFamily={'"Iowan Old Style", Georgia, serif'}
        noOfLines={2}
        mt={2}
      >
        {item.title}
      </Heading>
      <Flex
        align="center"
        justify="space-between"
        mt="auto"
        pt={5}
        color="#F7D987"
        fontSize="sm"
        gap={2}
      >
        <Text whiteSpace="nowrap">{item.votes} celebrations</Text>
        <HStack spacing={1} whiteSpace="nowrap">
          <Text>Open</Text>
          <FiArrowRight />
        </HStack>
      </Flex>
    </Flex>
  )
}
