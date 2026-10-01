import { Avatar, Button, HStack, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import useAuth from "../../hooks/useAuth"
import useMemoryProgress from "../../hooks/useMemoryProgress"
import { profileImageSrc } from "../../utils/profileImage"

const UserMenu = () => {
  const { user } = useAuth()
  const { data: progress } = useMemoryProgress()
  const displayName = user?.full_name || user?.email || "Your account"

  return (
    <Button
      as={Link}
      to="/settings"
      variant="outline"
      aria-label={`${displayName}, level ${progress?.level ?? 1}. Open account`}
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
        <Avatar
          name={displayName}
          src={profileImageSrc(user?.profile_image_url)}
          size="sm"
          bg="#2D766D"
          color="white"
        />
        <Text fontSize="sm" fontWeight="800" whiteSpace="nowrap">
          Lv {progress?.level ?? 1}
        </Text>
      </HStack>
    </Button>
  )
}

export default UserMenu
