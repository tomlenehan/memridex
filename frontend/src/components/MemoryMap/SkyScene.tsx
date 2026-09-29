import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react"
import { motion, useReducedMotion } from "framer-motion"
import { FiStar } from "react-icons/fi"

export type SceneStar = { title: string; x?: number | null; y?: number | null }
export type SceneLink = { a: number; b: number }

export default function SkyScene({ stars, links, selected, onSelect, label }: {
  stars: SceneStar[]
  links: SceneLink[]
  selected: number | null
  onSelect: (index: number) => void
  label: string
}) {
  const reduce = useReducedMotion()
  const height = Math.max(360, Math.ceil(stars.length / 4) * 170 + 120)
  const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(stars.length))))
  const positions = stars.map((star, i) => ({
    x: star.x == null ? ((i % columns) + .5) / columns : star.x,
    y: star.y == null ? (90 + Math.floor(i / columns) * 170 + (i % 2) * 25) / height : star.y,
  }))
  return <Box borderRadius="28px" overflow="hidden" bg="#102F3C" border="1px solid #315A64">
    <Box position="relative" minH={`${height}px`} minW="260px" bg="radial-gradient(circle at 55% 20%, #28525E, #102F3C 70%)" aria-label={label}>
      <Box position="absolute" inset={0} opacity={.3} backgroundImage="radial-gradient(#D8E1C5 1px, transparent 1px)" backgroundSize="30px 30px" pointerEvents="none" />
      <svg width="100%" height={height} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {links.map(({ a, b }, i) => positions[a] && positions[b] && <line key={`${a}-${b}-${i}`}
          x1={`${positions[a].x * 100}%`} y1={positions[a].y * height}
          x2={`${positions[b].x * 100}%`} y2={positions[b].y * height}
          stroke="#F7D987" strokeWidth={selected === a || selected === b ? 4 : 3} strokeLinecap="round" />)}
      </svg>
      {stars.map((star, i) => <Flex key={i} position="absolute" left={`${positions[i].x * 100}%`} top={`${positions[i].y * height - 38}px`}
        transform="translateX(-50%)" w="130px" direction="column" align="center" textAlign="center">
        <motion.div initial={reduce ? false : { opacity: 0, scale: .75 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * .08, .6) }}>
          <Button aria-label={`Explore ${star.title}`} aria-pressed={selected === i} onClick={() => onSelect(i)}
            variant="unstyled" display="inline-flex" alignItems="center" justifyContent="center" boxSize="72px" borderRadius="25px"
            bg={["#F5D785", "#B9DDCF", "#D8C9E6", "#F2C6AE"][i % 4]} border="3px solid #FFF8E8"
            boxShadow={selected === i ? "0 0 0 4px #F7D987, 0 0 26px #F7D98788" : "0 0 16px #F7D98755"}>
            <Icon as={FiStar} boxSize={7} color="#31594F" fill="#FFF9E8" />
          </Button>
        </motion.div>
        <Text mt={2} fontSize="sm" fontWeight="800" color="#FFF9E8" noOfLines={2} textShadow="0 2px 6px #092B36">{star.title}</Text>
      </Flex>)}
    </Box>
  </Box>
}
