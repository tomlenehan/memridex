import { useEffect } from "react";
import {
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
  Spinner,
} from "@chakra-ui/react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserStoryPromptsService, CategoriesService, ImagesService } from "../../client";
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

interface ImageData {
  id: number;
  link: string;
}

interface ImageMap {
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

  const { data: images } = useSuspenseQuery({
    queryKey: ["images"],
    queryFn: () => ImagesService.readImages(),
  });

  // Create a mapping of category ID to category name
  const categoryMap: CategoryMap = categories.data.reduce(
    (acc: CategoryMap, category: Category) => {
      acc[category.id] = category.name;
      return acc;
    },
    {} as CategoryMap
  );

  const imageMap: ImageMap = images.data.reduce(
    (acc: ImageMap, image: ImageData) => {
      acc[image.id] = image.link;
      return acc;
    },
    {} as ImageMap
  );

  // Use effect to refetch images periodically if any image URLs are missing
  useEffect(() => {
    const interval = setInterval(() => {
      userStoryPrompts.data.forEach((prompt) => {
        if (prompt.image_id && !imageMap[prompt.image_id]) {
          queryClient.invalidateQueries({ queryKey: ["images"] });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [userStoryPrompts, imageMap, queryClient]);

  return (
    <Tbody>
      {userStoryPrompts.data.map((prompt) => (
        <Tr key={prompt.id}>
          <Td>{prompt.prompt}</Td>
          <Td>{categoryMap[prompt.category_id || 0] || "N/A"}</Td>
          <Td>
            {prompt.image_id ? (
              imageMap[prompt.image_id] ? (
                <Image
                  src={imageMap[prompt.image_id]}
                  alt="thumbnail"
                  boxSize="50px"
                  objectFit="cover"
                />
              ) : (
                <Spinner size="sm" />
              )
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
    <TableContainer>
      <Table size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>Prompt</Th>
            <Th>Category</Th>
            <Th>Image</Th>
            <Th>Actions</Th>
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
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Manage Story Prompts
      </Heading>

      <Navbar type={"UserStoryPrompt"} />
      <UserStoryPromptsTable />
    </Container>
  );
}

export default User_story_prompts;
