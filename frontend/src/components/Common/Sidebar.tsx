import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { FiLogOut, FiMenu } from "react-icons/fi"

import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  const queryClient = useQueryClient()
  const bgColor = useColorModeValue("rgba(251, 252, 250, 0.92)", "ui.dark")
  const textColor = useColorModeValue("ui.ink", "ui.light")
  const panelBg = useColorModeValue("white", "ui.darkSlate")
  const borderColor = useColorModeValue("ui.line", "whiteAlpha.200")
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Mobile */}
      <IconButton
        onClick={onOpen}
        display={{ base: "flex", md: "none" }}
        aria-label="Open Menu"
        position="fixed"
        fontSize="20px"
        top={4}
        left={4}
        zIndex={10}
        bg="white"
        border="1px solid"
        borderColor="ui.line"
        boxShadow="0 12px 24px rgba(31, 41, 51, 0.08)"
        icon={<FiMenu />}
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="280px">
          <DrawerCloseButton />
          <DrawerBody py={8}>
            <Flex flexDir="column" justify="space-between" minH="full">
              <Box>
                <Flex justifyContent="flex-start" mb={6}>
                  <Text color="ui.main" fontSize="2xl" fontWeight="bold">
                    MemriPlace
                  </Text>
                </Flex>
                <SidebarItems onClose={onClose} />
                <Button
                  onClick={handleLogout}
                  mt={4}
                  variant="ghost"
                  color="ui.danger"
                  leftIcon={<FiLogOut />}
                  justifyContent="flex-start"
                  w="full"
                >
                  Log out
                </Button>
              </Box>
              {currentUser?.email && (
                <Box borderTop="1px solid" borderColor={borderColor} pt={4}>
                  <Text color="ui.muted" fontSize="xs" fontWeight="bold" mb={1}>
                    Signed in
                  </Text>
                  <Text color={textColor} noOfLines={2} fontSize="sm">
                    {currentUser.email}
                  </Text>
                </Box>
              )}
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop */}
      <Box
        bg={bgColor}
        p={4}
        h="100vh"
        position="sticky"
        top="0"
        flexShrink={0}
        display={{ base: "none", md: "flex" }}
        borderRight="1px solid"
        borderColor={borderColor}
        backdropFilter="blur(14px)"
      >
        <Flex
          flexDir="column"
          justify="space-between"
          bg={panelBg}
          p={4}
          borderRadius="8px"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="0 18px 45px rgba(31, 41, 51, 0.07)"
          minW="232px"
        >
          <Box>
            <Flex justifyContent="flex-start" mb={6}>
              <Text color="ui.main" fontSize="2xl" fontWeight="bold">
                MemriPlace
              </Text>
            </Flex>
            <SidebarItems />
          </Box>
          {currentUser?.email && (
            <Box borderTop="1px solid" borderColor={borderColor} pt={4}>
              <Text color="ui.muted" fontSize="xs" fontWeight="bold" mb={1}>
                Signed in
              </Text>
              <Text color={textColor} noOfLines={2} fontSize="sm" maxW="190px">
                {currentUser.email}
              </Text>
            </Box>
          )}
        </Flex>
      </Box>
    </>
  )
}

export default Sidebar
