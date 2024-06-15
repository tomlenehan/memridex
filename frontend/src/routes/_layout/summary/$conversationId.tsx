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
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchSummary, startStreamingSummary, addStreamingSummary, endStreamingSummary } from "../../../redux/summarySlice";

export const Route = createFileRoute("/_layout/summary/$conversationId")({
  component: SummaryPage,
});

function SummaryPage() {
  const { conversationId } = Route.useParams<{ conversationId: string }>(); // Add the correct type
  const dispatch = useDispatch<AppDispatch>();
  const summary = useSelector((state: RootState) => state.summary.summary);
  const summaryStatus = useSelector((state: RootState) => state.summary.status);
  const streamingSummary = useSelector((state: RootState) => state.summary.currentStreamingSummary);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchSummary(Number(conversationId)));
    }
  }, [conversationId, dispatch]);

  const handleGenerateSummary = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    dispatch(startStreamingSummary());

    const response = await fetch(`/api/v1/story_summaries/generate/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      dispatch(addStreamingSummary(chunk));
    }

    dispatch(endStreamingSummary());
  };

  if (!conversationId) {
    return <Box>Error: No conversation ID provided</Box>;
  }

  const conversationIdNumber = Number(conversationId);

  if (isNaN(conversationIdNumber)) {
    return <Box>Error: Invalid conversation ID provided</Box>;
  }

  return (
    <Container maxW="full" height="100vh" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" pt={12}>
        <Button as={Link} to="/conversations" marginTop={-6} colorScheme="teal" variant="outline">
          <Box as={IoChevronBackCircleOutline} size="20px" mr={2} />
          Back
        </Button>
        <Heading size="lg" textAlign={{ base: "center", md: "left" }}>
          Conversation Summary
        </Heading>
        <Button colorScheme="blue" onClick={handleGenerateSummary}>
          Generate Summary
        </Button>
      </Flex>

      <Flex flex="1" direction="column" overflow="hidden" mt={4}>
        <Box flex="1" overflowY="auto" p={4}>
          {summaryStatus === 'loading' ? (
            <Text>Loading summary...</Text>
          ) : summaryStatus === 'failed' ? (
            <Text>Error loading summary</Text>
          ) : summaryStatus === 'streaming' ? (
            <Text>{streamingSummary}</Text>
          ) : (
            <Text>{summary}</Text>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default SummaryPage;
