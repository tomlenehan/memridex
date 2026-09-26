import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FiArrowRight, FiBookOpen, FiMessageCircle, FiPenTool } from "react-icons/fi";

import homepageBg from "../../assets/images/homepage_parallax/background.png";
import type { UserPublic } from "../../client";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

const actions = [
  {
    title: "Start a conversation",
    text: "Choose a prompt and talk through a memory while the details are fresh.",
    icon: FiMessageCircle,
    path: "/conversations",
    cta: "Open prompts",
  },
  {
    title: "Edit prompts",
    text: "Add your own cues or adjust the prompts you already use.",
    icon: FiPenTool,
    path: "/user_story_prompts",
    cta: "Manage prompts",
  },
  {
    title: "Read memories",
    text: "Return to completed stories and keep polishing what matters.",
    icon: FiBookOpen,
    path: "/stories",
    cta: "View memories",
  },
];

function Dashboard() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const displayName = currentUser?.full_name || currentUser?.email || "there";

  return (
    <Container maxW="7xl" px={0}>
      <Stack spacing={{ base: 6, md: 8 }}>
        <Box
          bg="#17232B"
          color="white"
          borderRadius="8px"
          p={{ base: 6, md: 10 }}
          position="relative"
          overflow="hidden"
          minH={{ base: "360px", md: "420px" }}
          bgImage={`linear-gradient(90deg, rgba(23, 35, 43, 0.95), rgba(23, 35, 43, 0.70)), url(${homepageBg})`}
          bgSize="cover"
          bgPosition="center"
        >
          <Stack spacing={5} maxW="700px" h="full" justify="center">
            <Badge
              alignSelf="flex-start"
              bg="whiteAlpha.200"
              color="white"
              border="1px solid"
              borderColor="whiteAlpha.300"
              borderRadius="8px"
              px={3}
              py={1}
            >
              Welcome back
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: "36px", md: "56px" }}
              lineHeight="1.05"
              letterSpacing={0}
            >
              Hi, {displayName}
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7">
              Keep gathering the moments, details, and voices that make a memory
              worth saving.
            </Text>
            <Flex gap={3} flexWrap="wrap" pt={2}>
              <Button
                as={Link}
                to="/conversations"
                variant="primary"
                size="lg"
                rightIcon={<FiArrowRight />}
              >
                Tell a story
              </Button>
              <Button
                as={Link}
                to="/user_story_prompts"
                size="lg"
                bg="whiteAlpha.200"
                color="white"
                border="1px solid"
                borderColor="whiteAlpha.300"
                _hover={{ bg: "whiteAlpha.300" }}
              >
                Browse prompts
              </Button>
            </Flex>
          </Stack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          {actions.map((action) => (
            <Box
              key={action.title}
              bg="white"
              border="1px solid"
              borderColor="ui.line"
              borderRadius="8px"
              p={6}
              boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
            >
              <Stack spacing={4} h="full">
                <Flex
                  align="center"
                  justify="center"
                  boxSize="44px"
                  borderRadius="8px"
                  bg="ui.secondary"
                  color="ui.mainDark"
                >
                  <Icon as={action.icon} boxSize={5} />
                </Flex>
                <Box>
                  <Heading as="h2" size="md" mb={2}>
                    {action.title}
                  </Heading>
                  <Text color="ui.muted" lineHeight="1.7">
                    {action.text}
                  </Text>
                </Box>
                <Button
                  as={Link}
                  to={action.path}
                  variant="ghost"
                  color="ui.mainDark"
                  rightIcon={<FiArrowRight />}
                  alignSelf="flex-start"
                  mt="auto"
                >
                  {action.cta}
                </Button>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

export default Dashboard;
