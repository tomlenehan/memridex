import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from '@tanstack/react-router';
// import { Body_summaries_create_story_summary } from "../../client";

interface AddSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

const AddSummary: React.FC<AddSummaryProps> = ({ isOpen, onClose, conversationId }) => {
  const { register, handleSubmit } = useForm();
  const [toneValue, setToneValue] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const authors = [
    "None",
    "Ernest Hemingway",
    "Jane Austen",
    "Mark Twain",
    "J.K. Rowling",
    "George Orwell",
    "Virginia Woolf",
    "F. Scott Fitzgerald",
    "Toni Morrison",
    "Tracy Kidder",
    "Michael Lewis",
    "Philip Roth",
  ];

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const formData = {
        conversation_id: conversationId,
        tone: toneValue,
        author_style: data.author
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/summaries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to generate summary');
      }

      navigate({
        to: "/summary/$summaryId",
        params: { summaryId: responseData.id.toString() },
      });
      onClose();
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>Save Memory</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Factual to Poetic</FormLabel>
              <Slider
                defaultValue={50}
                min={0}
                max={100}
                step={1}
                value={toneValue}
                onChange={(val) => setToneValue(val)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Author Style</FormLabel>
              <Select placeholder="Select author style" {...register("author")}>
                {authors.map((author, index) => (
                  <option key={index} value={author}>
                    {author}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddSummary;