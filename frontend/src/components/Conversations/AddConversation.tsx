import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useState } from "react";
import axios from "axios";
import { type UserStoryPromptPublic } from "../../client";

interface AddConversationProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: UserStoryPromptPublic | null;
}

const AddConversation = ({ isOpen, onClose, prompt }: AddConversationProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ promptId, userId }: { promptId: number; userId: number }) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No access token found");
      }
      const response = await axios.post(
        "/api/v1/conversation/",
        { user_story_prompt_id: promptId, user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onClose();
    },
    onError: (err) => {
      console.error("Error creating conversation:", err);
    },
  });

  const handleConfirm = () => {
    if (prompt) {
      mutation.mutate({
        promptId: prompt.id,
        userId: prompt.user_id,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Start Chat?</ModalHeader>
        <ModalBody>
          <Text>Are you sure you want to start a conversation with this prompt?</Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" onClick={handleConfirm}>
            Yes
          </Button>
          <Button ml={3} onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddConversation;
