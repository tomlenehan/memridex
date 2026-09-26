import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorModeValue,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaUserGear } from "react-icons/fa6"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"

const UserMenu = () => {
  const { logout } = useAuth()
  const menuBg = useColorModeValue("white", "ui.darkSlate")
  const borderColor = useColorModeValue("ui.line", "whiteAlpha.200")

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top={4}
        right={4}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<FaUserGear fontSize="18px" />}
            bg={menuBg}
            color="ui.mainDark"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="0 14px 30px rgba(31, 41, 51, 0.10)"
            isRound
            _hover={{ bg: "ui.secondary" }}
          />
          <MenuList borderColor={borderColor} boxShadow="0 18px 45px rgba(31, 41, 51, 0.12)">
            <MenuItem icon={<FiUser fontSize="18px" />} as={Link} to="settings">
              My profile
            </MenuItem>
            <MenuItem
              icon={<FiLogOut fontSize="18px" />}
              onClick={handleLogout}
              color="ui.danger"
              fontWeight="bold"
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </>
  )
}

export default UserMenu
