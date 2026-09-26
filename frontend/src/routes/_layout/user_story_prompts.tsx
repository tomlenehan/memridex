import { useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
} from "@chakra-ui/react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserStoryPromptsService, CategoriesService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import Navbar from "../../components/Common/Navbar";

export const Route = createFileRoute("/_layout/user_story_prompts")({
  component: User_story_prompts,
});

// Define the types for the category and category map
interface Category {
  id: number;
  name: string;
}

interface CategoryMap {
  [key: number]: string;
}

function UserStoryPromptsTableBody() {
  const queryClient = useQueryClient();

  const { data: userStoryPrompts } = useSuspenseQuery({
    queryKey: ["userStoryPrompts"],
    queryFn: () => UserStoryPromptsService.readUserStoryPrompts({}),
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories({}),
  });

  // Create a mapping of category ID to category name
  const categoryMap: CategoryMap = categories.data.reduce(
    (acc: CategoryMap, category: Category) => {
      acc[category.id] = category.name;
      return acc;
    },
    {} as CategoryMap
  );

  // refetch user story prompts periodically if any image URLs are missing
  useEffect(() => {
    const promptsMissingImages = userStoryPrompts.data.some(
      (prompt) => !prompt.image_url
    );

    if (promptsMissingImages) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["userStoryPrompts"] });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [userStoryPrompts, queryClient]);

  return (
    <Tbody>
      {userStoryPrompts.data.map((prompt) => (
        <Tr key={prompt.id} _hover={{ bg: "ui.secondary" }}>
          <Td>{prompt.prompt.substring(0, 60)}...</Td>
          <Td>{categoryMap[prompt.category_id || 0] || "N/A"}</Td>
          <Td>
            {prompt.image_url ? (
              <Image
                src={prompt.image_url}
                alt="thumbnail"
                boxSize="50px"
                objectFit="cover"
                borderRadius="8px"
              />
            ) : (
              "N/A"
            )}
          </Td>
          <Td>
            <ActionsMenu type="UserStoryPrompt" value={prompt} />
          </Td>
        </Tr>
      ))}
    </Tbody>
  );
}

function UserStoryPromptsTable() {
  return (
    <TableContainer
      bg="white"
      border="1px solid"
      borderColor="ui.line"
      borderRadius="8px"
      boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
    >
      <Table size={{ base: "sm", md: "md" }}>
        <Thead bg="ui.secondary">
          <Tr>
            <Th color="ui.muted">Prompt</Th>
            <Th color="ui.muted">Category</Th>
            <Th color="ui.muted">Image</Th>
            <Th color="ui.muted">Actions</Th>
          </Tr>
        </Thead>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <Tbody>
              <Tr>
                <Td colSpan={5}>Something went wrong: {error.message}</Td>
              </Tr>
            </Tbody>
          )}
        >
          <Suspense
            fallback={
              <Tbody>
                {new Array(5).fill(null).map((_, index) => (
                  <Tr key={index}>
                    {new Array(5).fill(null).map((_, index) => (
                      <Td key={index}>
                        <Flex>
                          <Skeleton height="20px" width="20px" />
                        </Flex>
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            }
          >
            <UserStoryPromptsTableBody />
          </Suspense>
        </ErrorBoundary>
      </Table>
    </TableContainer>
  );
}

function User_story_prompts() {
  return (
    <Container maxW="7xl" px={0}>
      <Box>
        <Text color="ui.main" fontWeight="bold" mb={2}>
          Prompt library
        </Text>
        <Heading size="xl" letterSpacing={0}>
          Add and edit story prompts.
        </Heading>
        <Text color="ui.muted" mt={3} maxW="680px">
          Keep the questions that guide your conversations sharp, personal, and
          useful.
        </Text>
      </Box>

      <Navbar type="UserStoryPrompt" />
      <UserStoryPromptsTable />
    </Container>
  );
}

export default User_story_prompts;
