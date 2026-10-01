import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Stack,
  useDisclosure,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import {
  FiGitBranch,
  FiStar,
  FiLogOut,
  FiMenu,
  FiSettings,
} from "react-icons/fi"

import memriPlaceMark from "../../assets/images/MemriPlaceLighterLogo.png"
import useAuth from "../../hooks/useAuth"
import UserMenu from "./UserMenu"
import { PUBLIC_SKY_ENABLED } from "../../config"

const links = [
  { label: "My night sky", to: "/conversations", icon: FiGitBranch },
  { label: "Public night sky", to: "/night-sky", icon: FiStar },
] as const

function AppHeader() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user, logout } = useAuth()

  return (
    <Box
      as="header"
      bg="rgba(255,253,247,0.94)"
      borderBottom="1px solid"
      borderColor="ui.line"
      position="sticky"
      top={0}
      zIndex={20}
      backdropFilter="blur(12px)"
    >
      <Flex
        align="center"
        h={{ base: "68px", md: "80px" }}
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 8 }}
        gap={{ base: 2, md: 5 }}
      >
        <Link to="/" aria-label="MemriPlace home">
          <Image
            alt="MemriPlace home"
            display="block"
            h={{ base: "44px", md: "52px" }}
            objectFit="contain"
            src={memriPlaceMark}
            w={{ base: "48px", md: "54px" }}
          />
        </Link>

        <HStack
          as="nav"
          aria-label="Main navigation"
          display={{ base: "none", md: "flex" }}
          flex="1"
          justify="center"
          spacing={1}
        >
          {links.filter((item) => item.to !== "/night-sky" || PUBLIC_SKY_ENABLED).map((item) => (
            <Button
              key={item.label}
              as={Link}
              to={item.to}
              search={item.to === "/conversations" ? {} : undefined}
              variant="ghost"
              leftIcon={<Icon as={item.icon} />}
              borderRadius="full"
              color="ui.ink"
              fontSize="md"
              minH="48px"
              px={4}
              activeProps={{
                style: {
                  background: "#EAF3F1",
                  color: "#1F5E5C",
                  fontWeight: 700,
                },
              }}
              _hover={{ bg: "ui.secondary", color: "ui.mainDark" }}
            >
              {item.label}
            </Button>
          ))}
          {user?.is_superuser && (
            <Button
              as={Link}
              to="/admin"
              variant="ghost"
              color="ui.ink"
              fontSize="md"
              minH="48px"
              px={4}
              _hover={{ bg: "ui.secondary", color: "ui.mainDark" }}
            >
              Admin
            </Button>
          )}
        </HStack>

        <Flex
          align="center"
          gap={{ base: 1, md: 3 }}
          ml={{ base: "auto", md: 0 }}
        >
          <UserMenu />
          <IconButton
            aria-label="Open navigation menu"
            display={{ base: "inline-flex", md: "none" }}
            icon={<FiMenu />}
            onClick={onOpen}
            variant="ghost"
            fontSize="22px"
            minW="44px"
            minH="44px"
          />
        </Flex>
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="ui.light">
          <DrawerCloseButton minW="44px" minH="44px" />
          <DrawerBody pt={12}>
            <Stack as="nav" aria-label="Main navigation" spacing={2}>
              {links.filter((item) => item.to !== "/night-sky" || PUBLIC_SKY_ENABLED).map((item) => (
                <Button
                  key={item.label}
                  as={Link}
                  to={item.to}
                  search={item.to === "/conversations" ? {} : undefined}
                  onClick={onClose}
                  justifyContent="flex-start"
                  leftIcon={<Icon as={item.icon} />}
                  variant="ghost"
                  minH="54px"
                  fontSize="lg"
                  color="ui.ink"
                  activeProps={{
                    style: {
                      background: "#EAF3F1",
                      color: "#1F5E5C",
                      fontWeight: 700,
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {user?.is_superuser && (
                <Button
                  as={Link}
                  to="/admin"
                  onClick={onClose}
                  justifyContent="flex-start"
                  variant="ghost"
                  minH="54px"
                  fontSize="lg"
                  color="ui.ink"
                >
                  Admin
                </Button>
              )}
              <Button
                as={Link}
                to="/settings"
                onClick={onClose}
                justifyContent="flex-start"
                leftIcon={<FiSettings />}
                variant="ghost"
                minH="54px"
                color="ui.ink"
                fontSize="lg"
                _hover={{ bg: "ui.secondary" }}
              >
                My account
              </Button>
              <Button
                onClick={() => {
                  onClose()
                  logout()
                }}
                justifyContent="flex-start"
                leftIcon={<FiLogOut />}
                variant="ghost"
                color="ui.danger"
                minH="54px"
                fontSize="lg"
              >
                Log out
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default AppHeader
