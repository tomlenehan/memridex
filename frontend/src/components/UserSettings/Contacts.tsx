import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  HStack,
  List,
  ListItem,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ContactsService, ContactCreate, ContactRead } from "../../client";

const Contacts = () => {
  const [email, setEmail] = useState("");
  const toast = useToast();
  // const queryClient = useQueryClient();

  // Wrap ContactsService.readContacts to match the expected signature for queryFn
  const fetchContacts = async (): Promise<ContactRead[]> => {
    const response = await ContactsService.readContacts();
    return response;
  };

  const { data: emailList = [], refetch } = useQuery<ContactRead[]>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const addEmailMutation = useMutation<ContactRead, Error, ContactCreate>({
    mutationFn: (newContact: ContactCreate) => ContactsService.createContact({ requestBody: newContact }),
    onSuccess: () => {
      refetch();
      toast({
        title: "Email added.",
        description: "The email address has been added to your address book.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEmail("");
    },
    onError: () => {
      toast({
        title: "Error.",
        description: "The email address could not be added.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const deleteEmailMutation = useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      await ContactsService.deleteContact({ id });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Email deleted.",
        description: "The email address has been deleted from your address book.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: () => {
      toast({
        title: "Error.",
        description: "The email address could not be deleted.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleAddEmail = () => {
    if (email) {
      const newContact: ContactCreate = { email };
      addEmailMutation.mutate(newContact);
    }
  };

  const handleDeleteEmail = (id: number) => {
    deleteEmailMutation.mutate(id);
  };

  return (
    <Container maxW="full">
      <Box w={{ sm: "full", md: "50%" }}>
        <FormControl>
          <FormLabel>Add New Email Address</FormLabel>
          <HStack>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
            <Button colorScheme="teal" onClick={handleAddEmail}>
              Add
            </Button>
          </HStack>
        </FormControl>
      </Box>
      <Box w={{ sm: "full", md: "50%" }}>
        <List spacing={3}>
          {emailList.map((item) => (
            <ListItem key={item.id} marginTop={4}>
              <HStack justify="space-between">
                <Box>{item.email}</Box>
                <IconButton
                  aria-label="Delete email"
                  icon={<FaTrashAlt />}
                  onClick={() => handleDeleteEmail(item.id)}
                />
              </HStack>
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
};

export default Contacts;
