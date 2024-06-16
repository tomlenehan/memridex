import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Text,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_layout/summary/$summaryId")({
  component: SummaryPage,
});

function SummaryPage() {
  const { summaryId } = Route.useParams<{ summaryId: string }>(); // Correct type for summaryId
  const [summary, setSummary] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "succeeded" | "failed">("idle");

  useEffect(() => {
    const fetchSummary = async (summaryId: string) => {
      setStatus("loading");
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No access token found");
        }

        const response = await fetch(`/api/v1/summaries/${summaryId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }

        const data = await response.json();
        setSummary(data.summary_text);
        setStatus("succeeded");
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    };

    if (summaryId) {
      fetchSummary(summaryId);
    }
  }, [summaryId]);

  if (!summaryId) {
    return <Box>Error: No summary ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" pt={12}>
        <Button as={Link} to="/conversations" marginTop={-6} colorScheme="teal" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Back
        </Button>
        <Heading size="lg" textAlign={{ base: "center", md: "left" }}>
        </Heading>
      </Flex>

      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto" p={4}>
          {status === "loading" ? (
            <Text>Loading summary...</Text>
          ) : status === "failed" ? (
            <Text>Error loading summary</Text>
          ) : (
            <Text>{summary}</Text>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default SummaryPage;
