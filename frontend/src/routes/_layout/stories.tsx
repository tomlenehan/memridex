import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { FiArrowRight } from "react-icons/fi";

import { StorySummaryPublic, SummariesService } from "../../client";

export const Route = createFileRoute("/_layout/stories")({
  component: Stories,
});

function LoadingGrid() {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
      {new Array(6).fill(null).map((_, index) => (
        <Box
          key={index}
          bg="white"
          border="1px solid"
          borderColor="ui.line"
          borderRadius="8px"
          overflow="hidden"
        >
          <Skeleton height="210px" />
          <Stack p={5} spacing={3}>
            <Skeleton height="22px" width="75%" />
            <Skeleton height="18px" width="100%" />
            <Skeleton height="18px" width="70%" />
            <Skeleton height="42px" width="120px" />
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function StorySummariesList() {
  const { data: summariesData, isLoading, error } = useQuery({
    queryKey: ["summaries"],
    queryFn: () => SummariesService.readStorySummaries({}),
  });

  if (isLoading) {
    return <LoadingGrid />;
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        color="ui.danger"
        bg="white"
        border="1px solid"
        borderColor="ui.line"
        borderRadius="8px"
        p={8}
      >
        Something went wrong: {error.message}
      </Box>
    );
  }

  const summaries: StorySummaryPublic[] = summariesData || [];

  if (!summaries.length) {
    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="ui.line"
        borderRadius="8px"
        p={8}
      >
        <Heading size="md" mb={2}>
          No finished memories yet
        </Heading>
        <Text color="ui.muted">
          Complete a conversation summary and it will appear here.
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
      {summaries.map((summary: StorySummaryPublic) => (
        <Box
          key={summary.id}
          bg="white"
          border="1px solid"
          borderColor="ui.line"
          borderRadius="8px"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
        >
          {summary.image_url ? (
            <Image
              src={summary.image_url}
              alt={summary.summary_text}
              h="210px"
              w="full"
              objectFit="cover"
            />
          ) : (
            <Skeleton height="210px" />
          )}
          <Stack p={5} spacing={4} flex="1">
            <Box>
              <Heading as="h2" size="md" lineHeight="1.35" mb={3}>
                {summary.title}
              </Heading>
              <Text color="ui.muted" lineHeight="1.7">
                {summary.summary_text.substring(0, 140)}...
              </Text>
            </Box>
            <Flex mt="auto" justify="flex-start">
              <Button
                as={Link}
                to={`/summary/${summary.id}`}
                variant="primary"
                rightIcon={<FiArrowRight />}
              >
                Read memory
              </Button>
            </Flex>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function Stories() {
  return (
    <Container maxW="7xl" px={0}>
      <Stack spacing={6}>
        <Box>
          <Text color="ui.main" fontWeight="bold" mb={2}>
            Memories
          </Text>
          <Heading size="xl" letterSpacing={0}>
            Finished stories, ready to revisit.
          </Heading>
          <Text color="ui.muted" mt={3} maxW="680px">
            Review saved summaries, keep editing, and share the memories that
            feel complete.
          </Text>
        </Box>

        <ErrorBoundary
          fallbackRender={({ error }) => (
            <Box textAlign="center" color="ui.danger">
              Something went wrong: {error.message}
            </Box>
          )}
        >
          <StorySummariesList />
        </ErrorBoundary>
      </Stack>
    </Container>
  );
}

export default Stories;
