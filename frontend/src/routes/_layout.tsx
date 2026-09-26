import { Box, Flex, Spinner } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Sidebar from "../components/Common/Sidebar"
import UserMenu from "../components/Common/UserMenu"
import useAuth, { hasValidSession } from "../hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!(await hasValidSession())) {
      throw redirect({
        to: "/landing",
      })
    }
  },
})

function Layout() {
  const { isLoading } = useAuth()

  return (
    <Flex minH="100vh" bg="ui.light" position="relative">
      <Sidebar />
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        <Box
          as="main"
          flex="1"
          minW={0}
          px={{ base: 4, md: 8 }}
          py={{ base: 20, md: 8 }}
        >
          <Outlet />
        </Box>
      )}
      <UserMenu />
    </Flex>
  )
}
