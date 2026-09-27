import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"

const UserMenu = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<FiUser />}
        variant="outline"
        minH="48px"
        borderColor="ui.line"
        color="ui.ink"
        bg="white"
        _hover={{ bg: "ui.secondary" }}
      >
        Account
      </MenuButton>
      <MenuList borderColor="ui.line" boxShadow="0 18px 45px rgba(31, 41, 51, 0.12)">
        <MenuItem icon={<FiUser />} as={Link} to="/settings">
          Account settings
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
