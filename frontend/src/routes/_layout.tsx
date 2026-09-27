import { Box, Flex, Spinner } from "@chakra-ui/react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router"

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
  const reduce = useReducedMotion()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

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
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </Box>
      )}
    </Flex>
  )
}
