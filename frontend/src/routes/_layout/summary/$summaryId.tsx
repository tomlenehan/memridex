import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { FaRegSave } from "react-icons/fa";
import { useForm, SubmitHandler } from "react-hook-form";
import { SummariesService } from "../../../client";

export const Route = createFileRoute("/_layout/summary/$summaryId")({
  component: SummaryPage,
});

type Status = "idle" | "loading" | "succeeded" | "failed";

interface SummaryFormInputs {
  title: string;
  summary: string;
}

function SummaryPage() {
  const { summaryId } = Route.useParams<{ summaryId: string }>(); // Correct type for summaryId
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SummaryFormInputs>();
  const [status, setStatus] = useState<Status>("idle");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummary = async (summaryId: string) => {
      setStatus("loading");
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No access token found");
        }

        const response = await SummariesService.readStorySummary({ id: Number(summaryId) });

        setValue("summary", response.summary_text || "");
        setValue("title", response.title || "");
        setStatus("succeeded");
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    };

    if (summaryId) {
      fetchSummary(summaryId);
    }
  }, [summaryId, setValue]);

  const onSubmit: SubmitHandler<SummaryFormInputs> = async (data) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No access token found");
      }

      await SummariesService.updateStorySummary({
        id: Number(summaryId),
        title: data.title,
        summaryText: data.summary, // use summaryText instead of summary_text
      });

      setIsSaving(false);
      setStatus("succeeded");
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      setStatus("failed");
    }
  };

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
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl isInvalid={!!errors.title}>
                <FormLabel>Title</FormLabel>
                <Input
                  type="text"
                  placeholder={"Enter a meaningful title for your memory here"}
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && <Text color="red.500">{errors.title.message}</Text>}
              </FormControl>
              <FormControl mt={4} isInvalid={!!errors.summary}>
                <FormLabel>Summary</FormLabel>
                <Textarea
                  minHeight={300}
                  {...register("summary", { required: "Summary is required" })}
                />
                {errors.summary && <Text color="red.500">{errors.summary.message}</Text>}
              </FormControl>
              <Button
                mt={4}
                rightIcon={<FaRegSave />}
                colorScheme="blue"
                type="submit"
                isLoading={isSaving}
              >
                Save
              </Button>
            </form>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default SummaryPage;
