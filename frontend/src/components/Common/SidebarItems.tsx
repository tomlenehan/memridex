import { Box, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { FiBook, FiBookOpen, FiHome, FiSettings, FiUsers } from "react-icons/fi";
import { GiConversation } from "react-icons/gi";
import useAuth from "../../hooks/useAuth";

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: GiConversation, title: "Chat", path: "/conversations" },
  { icon: FiBook, title: "Prompts", path: "/user_story_prompts" },
  { icon: FiSettings, title: "Settings", path: "/settings" },
];

interface SidebarItemsProps {
  onClose?: () => void;
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const textColor = useColorModeValue("ui.main", "ui.light");
  const bgActive = useColorModeValue("#E2E8F0", "#4A5568");
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const hasStorySummaries = (user?.story_summaries?.length ?? 0) > 0;

  const finalItems = [...items];

  if (hasStorySummaries) {
    finalItems.splice(3, 0, { icon: FiBookOpen, title: "Stories", path: "/stories" });
  }

  if (user?.is_superuser) {
    finalItems.push({ icon: FiUsers, title: "Admin", path: "/admin" });
  }

  const listItems = finalItems.map(({ icon, title, path }) => (
    <Flex
      as={Link}
      to={path}
      w="100%"
      p={2}
      key={title}
      activeProps={{
        style: {
          background: bgActive,
          borderRadius: "12px",
        },
      }}
      color={textColor}
      onClick={onClose}
    >
      <Icon as={icon} alignSelf="center" />
      <Text ml={2}>{title}</Text>
    </Flex>
  ));

  return <Box>{listItems}</Box>;
};

export default SidebarItems;
