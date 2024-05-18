import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiEdit, FiTrash } from "react-icons/fi";

import type { UserStoryPromptPublic } from "../../client";
import EditUserStoryPrompt from "../user_story_prompts/EditUserStoryPrompt";
import Delete from "../Common/DeleteAlert";

interface ActionsMenuUserStoryPromptProps {
  value: UserStoryPromptPublic;
  disabled?: boolean;
}

const ActionsMenuUserStoryPrompt = ({
  value,
  disabled,
}: ActionsMenuUserStoryPromptProps) => {
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  return (
    <>
      <Menu>
        <MenuButton
          isDisabled={disabled}
          as={Button}
          rightIcon={<BsThreeDotsVertical />}
          variant="unstyled"
        />
        <MenuList>
          <MenuItem
            onClick={editModal.onOpen}
            icon={<FiEdit fontSize="16px" />}
          >
            Edit User Story Prompt
          </MenuItem>
          <MenuItem
            onClick={deleteModal.onOpen}
            icon={<FiTrash fontSize="16px" />}
            color="ui.danger"
          >
            Delete User Story Prompt
          </MenuItem>
        </MenuList>
        <EditUserStoryPrompt
          prompt={value}
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
        />
        <Delete
          type="UserStoryPrompt"
          id={value.id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </Menu>
    </>
  );
};

export default ActionsMenuUserStoryPrompt;
