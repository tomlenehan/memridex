import {
  Alert, AlertIcon, Box, Button, Flex, Icon, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Stack, Text,
} from "@chakra-ui/react"
import { FiArrowRight } from "react-icons/fi"
import { storyStarters, type StoryStarterTopic } from "../../lib/storyStarters"

export default function StoryTopicPicker({ isOpen, onClose, onChoose, startingTopic, hasError }: {
  isOpen: boolean
  onClose: () => void
  onChoose: (topic: StoryStarterTopic) => void
  startingTopic: StoryStarterTopic | null
  hasError: boolean
}) {
  return <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl" scrollBehavior="inside" closeOnOverlayClick={!startingTopic}>
    <ModalOverlay bg="rgba(6, 29, 38, .72)" />
    <ModalContent mx={4} borderRadius="8px" bg="#FFFDF7" color="#17353B">
      <ModalHeader fontFamily={'"Iowan Old Style", Georgia, serif'} fontSize={{ base: "2xl", md: "3xl" }} pr={14}>
        What would you like to talk about?
      </ModalHeader>
      <ModalCloseButton aria-label="Close topic choices" minW="44px" minH="44px" isDisabled={!!startingTopic} />
      <ModalBody pb={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {storyStarters.map((starter) => <Button key={starter.topic} variant="storyStarter"
            borderRadius="8px" minH="112px" px={4} py={4} isDisabled={!!startingTopic}
            isLoading={startingTopic === starter.topic} onClick={() => onChoose(starter.topic)}
            aria-label={`Start a memory about ${starter.title.toLowerCase()}`}>
            <Flex align="center" gap={3} w="full">
              <Box display="grid" placeItems="center" boxSize="46px" flexShrink={0} borderRadius="8px" bg={starter.color}>
                <Icon as={starter.icon} boxSize={5} color="#214D4D" />
              </Box>
              <Stack spacing={1} flex="1" minW={0} align="start">
                <Text fontWeight="800" fontSize="md" whiteSpace="normal" lineHeight="1.3">{starter.title}</Text>
                <Text color="#61777A" fontWeight="normal" fontSize="sm" whiteSpace="normal" lineHeight="1.4">{starter.description}</Text>
              </Stack>
              <Icon as={FiArrowRight} color="#4B8D82" boxSize={5} flexShrink={0} />
            </Flex>
          </Button>)}
        </SimpleGrid>
        {hasError && <Alert status="error" mt={4} borderRadius="8px"><AlertIcon />We couldn’t start this memory. Please try again.</Alert>}
      </ModalBody>
    </ModalContent>
  </Modal>
}
