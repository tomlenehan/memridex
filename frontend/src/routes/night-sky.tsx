import { Alert, AlertIcon, Box, Button, Flex, Heading, HStack, Icon, Image, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowRight, FiList, FiMoon, FiStar } from "react-icons/fi"
import memriPlaceMark from "../assets/images/MemriPlaceLighterLogo.png"
import ConstellationStar from "../components/Common/ConstellationStar"
import { nightSkyApi, type SkyCluster } from "../lib/nightSkyApi"

export const Route = createFileRoute("/night-sky")({ component: PublicSky })

function PublicSky() {
  const [sort, setSort] = useState<"recent" | "appreciated">("recent")
  const [view, setView] = useState<"sky" | "list">("sky")
  const [page, setPage] = useState(0)
  const query = useQuery({ queryKey: ["publicSky", sort, page], queryFn: () => nightSkyApi.browse(sort, page * 24) })
  const data = query.data?.data ?? []
  return <Box minH="100vh" bg="#FFFDF5" color="#17353B">
    <Flex as="header" align="center" justify="space-between" gap={4} px={{ base: 5, md: 10 }} py={4} bg="#FFFDF5">
      <HStack as={Link} to="/landing" spacing={3}><Image src={memriPlaceMark} alt="MemriPlace" boxSize="48px" objectFit="contain" /><Text fontWeight="800">MemriPlace</Text></HStack>
      <HStack><Button as={Link} to="/landing" variant="ghost" size="sm">Home</Button><Button as={Link} to="/conversations" variant="secondary" size="sm">My night sky</Button></HStack>
    </Flex>
    <Box bg="radial-gradient(circle at 55% 15%, #315B65, #102F3C 65%, #0B2634)" color="#FFF9E8" pb={16}>
      <Flex maxW="7xl" mx="auto" px={{ base: 5, md: 10 }} pt={{ base: 10, md: 16 }} pb={8} align="center" justify="space-between" gap={5}>
        <Box><HStack color="#F5D785" fontSize="xs" fontWeight="800" letterSpacing=".13em"><Icon as={FiMoon} /> STORIES SHARED BY CHOICE</HStack>
          <Heading fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "4xl", md: "6xl" }} mt={3}>The public night sky</Heading>
          <Text color="#D4E7DF" maxW="640px" fontSize={{ base: "md", md: "lg" }} mt={4} lineHeight="1.7">Each glow is a constellation someone chose to share. Come closer to follow the memories within it.</Text>
        </Box>
        <ConstellationStar boxSize="130px" display={{ base: "none", md: "block" }} />
      </Flex>
      <Flex maxW="7xl" mx="auto" px={{ base: 5, md: 10 }} justify="space-between" align="center" flexWrap="wrap" gap={3} mb={6}>
        <HStack><Button size="sm" onClick={() => { setSort("recent"); setPage(0) }} variant={sort === "recent" ? "solid" : "outline"} colorScheme="yellow">Recently shared</Button>
          <Button size="sm" onClick={() => { setSort("appreciated"); setPage(0) }} variant={sort === "appreciated" ? "solid" : "outline"} colorScheme="yellow">Appreciated</Button></HStack>
        <Button size="sm" onClick={() => setView(view === "sky" ? "list" : "sky")} leftIcon={<FiList />}
          variant="outline" color="#FFF9E8" bg="transparent" borderColor="#A7CAC1" _hover={{ bg: "#315B65" }}>
          {view === "sky" ? "List view" : "Sky view"}
        </Button>
      </Flex>
      <Box maxW="7xl" mx="auto" px={{ base: 5, md: 10 }}>
        {query.isLoading && <Flex minH="300px" align="center" justify="center"><Spinner size="xl" color="#F5D785" /></Flex>}
        {query.isError && <Alert status="info" borderRadius="2xl" color="#17353B"><AlertIcon />The public night sky is being prepared. Your private sky is still here when you sign in.</Alert>}
        {query.isSuccess && data.length === 0 && <Flex minH="320px" direction="column" align="center" justify="center" textAlign="center"><Icon as={FiStar} boxSize={12} color="#F5D785" /><Heading size="md" mt={4}>A quiet sky, for now.</Heading><Text color="#D4E7DF" mt={2}>The first shared constellations will appear here.</Text></Flex>}
        {query.isSuccess && data.length > 0 && (view === "sky" ? <Flex minH="430px" flexWrap="wrap" align="center" justify="center" gap={{ base: 5, md: 8 }} py={8}>
          {data.map((item) => <Cluster key={item.id} item={item} />)}
        </Flex> : <Box bg="#153845" borderRadius="24px" p={{ base: 4, md: 7 }}>
          {data.map((item) => <Flex key={item.id} as={Link} to="/night-sky/$publicationId" params={{ publicationId: String(item.id) }}
            borderBottom="1px solid #3C6166" py={4} gap={4} align="center" _hover={{ bg: "#214C55" }} borderRadius="lg" px={3}>
            <Icon as={FiStar} color="#F5D785" boxSize={6} /><Box flex="1"><Text fontWeight="800">{item.title}</Text>
              <Text fontSize="sm" color="#BED8CF">{item.author_name} · Level {item.author_level} · {item.star_count} stars · {item.votes} appreciations</Text></Box><FiArrowRight />
          </Flex>)}
        </Box>)}
        {query.isSuccess && query.data && query.data.count > 24 && <HStack justify="center" mt={7}>
          <Button size="sm" onClick={() => setPage(Math.max(0, page - 1))} isDisabled={page === 0}>Previous</Button>
          <Text fontSize="sm">{page + 1} of {Math.ceil(query.data.count / 24)}</Text>
          <Button size="sm" onClick={() => setPage(page + 1)} isDisabled={(page + 1) * 24 >= query.data.count}>Next</Button>
        </HStack>}
      </Box>
    </Box>
  </Box>
}

function Cluster({ item }: { item: SkyCluster }) {
  const glow = Math.min(30, 10 + Math.log2(item.votes + 1) * 5)
  return <Flex as={Link} to="/night-sky/$publicationId" params={{ publicationId: String(item.id) }}
    w={{ base: "145px", md: "210px" }} minH={{ base: "160px", md: "205px" }} direction="column" align="center" justify="center" textAlign="center"
    borderRadius="50%" p={4} bg="radial-gradient(circle, #335F64, #1C424B 65%, transparent)"
    boxShadow={`0 0 ${glow}px #F4D17C88`} transition="transform .2s ease, box-shadow .2s ease"
    _hover={{ transform: "translateY(-5px)", boxShadow: `0 0 ${glow + 12}px #F4D17CAA` }}>
    <HStack spacing={1} color="#F5D785" mb={2}><Icon as={FiStar} fill="#F5D785" /><Icon as={FiStar} /><Icon as={FiStar} /></HStack>
    <Text fontWeight="800" fontSize={{ base: "sm", md: "md" }} noOfLines={2}>{item.title}</Text>
    <Text fontSize="xs" color="#C7DED6" mt={2}>{item.author_name} · Level {item.author_level}</Text>
    <Text fontSize="xs" color="#F5D785" mt={1}>{item.star_count} stars · {item.votes} ♥</Text>
  </Flex>
}
