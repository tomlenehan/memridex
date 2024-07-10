import {
  Box,
  Button,
  Container,
  Heading,
  Image,
  Skeleton,
  Text,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { SummariesService, StorySummaryPublic } from "../../client";

export const Route = createFileRoute("/_layout/stories")({
  component: Stories,
});

function StorySummariesList() {
  const { data: summariesData, isLoading, error } = useQuery({
    queryKey: ["summaries"],
    queryFn: () => SummariesService.readStorySummaries({}),
  });



  if (isLoading) {
    return (
      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {new Array(6).fill(null).map((_, index) => (
          <Box
            key={index}
            maxW="sm"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
          >
            <Skeleton height="200px" />
            <Box p={6}>
              <Skeleton height="20px" width="70%" />
              <Skeleton height="20px" width="50%" mt={2} />
              <Skeleton height="20px" width="60%" mt={2} />
              <Skeleton height="40px" width="100%" mt={4} />
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="red.500">
        Something went wrong: {error.message}
      </Box>
    );
  }
  
  const summaries: StorySummaryPublic[] = summariesData || [];

  return (
    <SimpleGrid columns={[1, 2, 3]} spacing={4}>
      {summaries.map((summary: StorySummaryPublic) => (
        <Box
          key={summary.id}
          maxW="sm"
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
        >
          {summary.image_url ? (
            <Image src={summary.image_url} alt={summary.summary_text} />
          ) : (
            <Skeleton height="200px" />
          )}
          <Box p={6}>
            <Heading size="md">{summary.title}</Heading>
            <Text mt={2} color="gray.600">
              {summary.summary_text.substring(0, 100)}...
            </Text>
            <Flex mt={4} justifyContent="space-between" alignItems="center">
              <Button
                as={Link}
                to={`/summary/${summary.id}`}
                colorScheme="purple"
                size="md"
              >
                View Memory
              </Button>
            </Flex>
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function Stories() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
      </Heading>

      <ErrorBoundary
        fallbackRender={({ error }) => (
          <Box textAlign="center" color="red.500">
            Something went wrong: {error.message}
          </Box>
        )}
      >
        <StorySummariesList />
      </ErrorBoundary>
    </Container>
  );
}

export default Stories;
