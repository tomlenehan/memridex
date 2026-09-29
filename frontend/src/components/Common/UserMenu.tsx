import {
  Avatar,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"
import useMemoryProgress from "../../hooks/useMemoryProgress"

const UserMenu = () => {
  const { logout, user } = useAuth()
  const { data: progress } = useMemoryProgress()
  const displayName = user?.full_name || user?.email || "Your account"

  const handleLogout = async () => {
    logout()
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="outline"
        aria-label={`${displayName}, level ${progress?.level ?? 1}. Open account menu`}
        minH="48px"
        minW="76px"
        px={2}
        borderRadius="8px"
        borderColor="ui.line"
        color="ui.ink"
        bg="white"
        _hover={{ bg: "ui.secondary" }}
      >
        <HStack spacing={2}>
          <Avatar name={displayName} size="sm" bg="#2D766D" color="white" />
          <Text fontSize="sm" fontWeight="800" whiteSpace="nowrap">Lv {progress?.level ?? 1}</Text>
        </HStack>
      </MenuButton>
      <MenuList borderColor="ui.line" boxShadow="0 18px 45px rgba(31, 41, 51, 0.12)">
        <MenuItem icon={<FiUser />} as={Link} to="/settings">
          My account
        </MenuItem>
        <MenuItem
          icon={<FiLogOut />}
          onClick={handleLogout}
          color="ui.danger"
          fontWeight="bold"
        >
          Log out
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default UserMenu
