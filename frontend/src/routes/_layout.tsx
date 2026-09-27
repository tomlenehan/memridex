import { Box, Flex, Spinner } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import AppHeader from "../components/Common/AppHeader"
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
    <Flex minH="100vh" bg="ui.light" position="relative" direction="column">
      <AppHeader />
      {isLoading ? (
        <Flex justify="center" align="center" height="100vh" width="full">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        <Box
          as="main"
          flex="1"
          minW={0}
          w="full"
          px={{ base: 4, sm: 6, md: 8 }}
          py={{ base: 6, md: 8 }}
        >
          <Outlet />
        </Box>
      )}
    </Flex>
  )
}
