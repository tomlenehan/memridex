import { Button, Flex, Icon, useDisclosure } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";

import AddUser from "../Admin/AddUser";
import AddItem from "../Items/AddItem";
import AddUserStoryPrompt from "../UserStoryPrompts/AddUserStoryPrompt"; // Import the new component

interface NavbarProps {
  type: string;
}

const Navbar = ({ type }: NavbarProps) => {
  const addUserModal = useDisclosure();
  const addItemModal = useDisclosure();
  const addUserStoryPromptModal = useDisclosure(); // New modal control

  const handleOpen = () => {
    switch (type) {
      case "User":
        addUserModal.onOpen();
        break;
      case "Item":
        addItemModal.onOpen();
        break;
      case "UserStoryPrompt":
        addUserStoryPromptModal.onOpen();
        break;
      default:
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
          <Icon as={FaPlus} /> Add {type}
        </Button>
        <AddUser isOpen={addUserModal.isOpen} onClose={addUserModal.onClose} />
        <AddItem isOpen={addItemModal.isOpen} onClose={addItemModal.onClose} />
        <AddUserStoryPrompt isOpen={addUserStoryPromptModal.isOpen} onClose={addUserStoryPromptModal.onClose} />
      </Flex>
    </>
  );
};

export default Navbar;
