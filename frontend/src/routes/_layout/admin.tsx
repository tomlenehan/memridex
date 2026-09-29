import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { Suspense } from "react"
import { type UserPublic, UsersService } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu"
import Navbar from "../../components/Common/Navbar"
import { nightSkyApi } from "../../lib/nightSkyApi"

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
})

const MembersTableBody = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const { data: users } = useSuspenseQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.readUsers({}),
  })

  return (
    <Tbody>
      {users.data.map((user) => (
        <Tr key={user.id}>
          <Td color={!user.full_name ? "ui.dim" : "inherit"}>
            {user.full_name || "N/A"}
            {currentUser?.id === user.id && (
              <Badge ml="1" colorScheme="teal">
                You
              </Badge>
            )}
          </Td>
          <Td>{user.email}</Td>
          <Td>{user.is_superuser ? "Superuser" : "User"}</Td>
          <Td>
            <Flex gap={2}>
              <Box
                w="2"
                h="2"
                borderRadius="50%"
                bg={user.is_active ? "ui.success" : "ui.danger"}
                alignSelf="center"
              />
              {user.is_active ? "Active" : "Inactive"}
            </Flex>
          </Td>
          <Td>
            <ActionsMenu
              type="User"
              value={user}
              disabled={currentUser?.id === user.id ? true : false}
            />
          </Td>
        </Tr>
      ))}
    </Tbody>
  )
}

const MembersBodySkeleton = () => {
  return (
    <Tbody>
      <Tr>
        {new Array(5).fill(null).map((_, index) => (
          <Td key={index}>
            <SkeletonText noOfLines={1} paddingBlock="16px" />
          </Td>
        ))}
      </Tr>
    </Tbody>
  )
}

function Admin() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        User Management
      </Heading>
      <Navbar type={"User"} />
      <TableContainer>
        <Table fontSize="md" size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th width="20%">Full name</Th>
              <Th width="50%">Email</Th>
              <Th width="10%">Role</Th>
              <Th width="10%">Status</Th>
              <Th width="10%">Actions</Th>
            </Tr>
          </Thead>
          <Suspense fallback={<MembersBodySkeleton />}>
            <MembersTableBody />
          </Suspense>
        </Table>
      </TableContainer>
      <ReportsQueue />
    </Container>
  )
}

function ReportsQueue() {
  const queryClient = useQueryClient()
  const reports = useQuery({ queryKey: ["skyReports"], queryFn: nightSkyApi.reports })
  const resolve = useMutation({ mutationFn: nightSkyApi.resolveReport, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skyReports"] }) })
  const hide = useMutation({ mutationFn: nightSkyApi.hidePublication, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skyReports"] }) })
  return <Box mt={12} mb={12}>
    <Heading size="md" mb={4}>Public sky reports</Heading>
    {reports.isLoading && <Box color="ui.muted">Loading reports…</Box>}
    {reports.isError && <Box color="red.600">Couldn’t load reports.</Box>}
    {reports.data?.filter((report) => report.status === "open").length === 0 && <Box color="ui.muted">No open reports.</Box>}
    {reports.data?.filter((report) => report.status === "open").map((report) =>
      <Flex key={report.id} p={4} mb={3} border="1px solid #DCE7D5" borderRadius="xl" align="center" justify="space-between" gap={4} flexWrap="wrap">
        <Box><Box fontWeight="800">Constellation #{report.publication_id}</Box><Box mt={1}>{report.reason}</Box></Box>
        <Flex gap={2}><Button as={Link} to="/night-sky/$publicationId" params={{ publicationId: String(report.publication_id) }} size="sm" variant="outline">Review</Button>
          <Button size="sm" onClick={() => resolve.mutate(report.id)} isLoading={resolve.isPending}>Resolve</Button>
          <Button size="sm" colorScheme="red" onClick={() => { if (window.confirm("Remove this constellation from the public sky?")) hide.mutate(report.publication_id) }} isLoading={hide.isPending}>Remove from public sky</Button></Flex>
      </Flex>)}
      {(hide.isError || resolve.isError) && <Box color="red.600">Couldn’t update the report. Try again.</Box>}
  </Box>
}
