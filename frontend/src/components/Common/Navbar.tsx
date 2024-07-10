import { Button, Flex, Icon, useDisclosure } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";

import AddUser from "../Admin/AddUser";
import AddItem from "../Items/AddItem";
import AddUserStoryPrompt from "../UserStoryPrompts/AddUserStoryPrompt";

interface NavbarProps {
  type: string;
}

const Navbar = ({ type }: NavbarProps) => {
  const addUserModal = useDisclosure();
  const addItemModal = useDisclosure();
  const addUserStoryPromptModal = useDisclosure();
  const [label, setLabel] = useState('');

  const handleOpen = () => {
    switch (type) {
      case "User":
        addUserModal.onOpen();
        setLabel("user");
        break;
      case "Item":
        addItemModal.onOpen();
        setLabel("item");
        break;
      case "UserStoryPrompt":
        addUserStoryPromptModal.onOpen();
        setLabel("story prompt");
        break;
      default:
        setLabel('');
        break;
    }
  };

  return (
    <>
      <Flex py={8} gap={4}>
        <Button
          variant="primary"
          gap={1}
          fontSize={{ base: "sm", md: "inherit" }}
          onClick={handleOpen}
        >
          <Icon as={FaPlus} /> Add {label}
        </Button>
        <AddUser isOpen={addUserModal.isOpen} onClose={addUserModal.onClose} />
        <AddItem isOpen={addItemModal.isOpen} onClose={addItemModal.onClose} />
        <AddUserStoryPrompt isOpen={addUserStoryPromptModal.isOpen} onClose={addUserStoryPromptModal.onClose} />
      </Flex>
    </>
  );
};

export default Navbar;
