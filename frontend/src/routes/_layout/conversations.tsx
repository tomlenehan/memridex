import {
  Container,
  Flex,
  Heading,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { ConversationsService } from "../../client"
// import ActionsMenu from "../../components/Common/ActionsMenu"
import Navbar from "../../components/Common/Navbar"

export const Route = createFileRoute("/_layout/conversations")({
  component: Conversations,
})

function ConversationsTableBody() {
  const { data: conversations } = useSuspenseQuery({
    queryKey: ["conversations"],
    queryFn: () => ConversationsService.readConversations({}),
  })

  return (
    <Tbody>
      {conversations.data.map((conversation) => (
        <Tr key={conversation.id}>
          <Td>{conversation.id}</Td>
          <Td>{conversation.user_id}</Td>
          <Td>{new Date(conversation.created_at).toLocaleString()}</Td>
          {/*<Td>*/}
          {/*  <ActionsMenu type={"Conversation"} value={conversation} />*/}
          {/*</Td>*/}
        </Tr>
      ))}
    </Tbody>
  )
}
function ConversationsTable() {
  return (
    <TableContainer>
      <Table size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>User ID</Th>
            <Th>Created At</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <Tbody>
              <Tr>
                <Td colSpan={4}>Something went wrong: {error.message}</Td>
              </Tr>
            </Tbody>
          )}
        >
          <Suspense
            fallback={
              <Tbody>
                {new Array(5).fill(null).map((_, index) => (
                  <Tr key={index}>
                    {new Array(4).fill(null).map((_, index) => (
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
            <ConversationsTableBody />
          </Suspense>
        </ErrorBoundary>
      </Table>
    </TableContainer>
  )
}

function Conversations() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Conversations Management
      </Heading>

      <Navbar type={"Conversation"} />
      <ConversationsTable />
    </Container>
  )
}

export default Conversations;
