import { Box, Container, Text, Heading, Button, Image } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { UserPublic } from "../../client";
// import girlBookImage from "../../assets/images/girl_book.png";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  return (
    <>
      <Container maxW="full" p={0} position="relative">
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100vh"
          bgGradient="linear(to-b, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))"
          zIndex={-2}
        />
        <Image
          src="https://memribox-defaults.s3.amazonaws.com/site_assets/homepage_bg.png"
          alt="Engaging Visual"
          objectFit="cover"
          width="100%"
          height="100vh"
          position="absolute"
          top={0}
          left={0}
          zIndex={-3}
          box-shadow="0 30px 40px rgba(0,0,0,.1)"
        />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          color="white"
          p={4}
        >
          <Heading as="h1" size="2xl" mb={4} color="#64a8a8">
            Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
          </Heading>
          <Text fontSize="xl" mb={4} color="#329393">
            Welcome back, nice to see you again!
          </Text>
          <Text fontSize="2xl" fontWeight="bold" mb={10} color="#109393">
            Everyone has a story to tell. What's yours?
          </Text>
          <Link to="/conversations">
            <Button
              size="lg"
              colorScheme="teal"
              variant="solid"
              _hover={{ bg: "#81c4c4", color: "teal" }}
              mt={0}
              boxShadow="md"
            >
              Let's Tell a Story
            </Button>
          </Link>
        </Box>
      </Container>
    </>
  );
}

export default Dashboard;
