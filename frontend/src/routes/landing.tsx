import {
  Box,
  Container,
  Text,
  Heading,
  Button,
  Image,
  Flex,
  Card,
  CardBody,
  Input,
  Textarea,
  VStack,
  Highlight,
  SimpleGrid,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import LogoText from "../assets/images/memridex-text-logo.png";
import useCustomToast from "../hooks/useCustomToast";
import { useForm, SubmitHandler } from "react-hook-form";
import {ContactEmailSchema, UtilsService} from "../client";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

interface ContactFormInputs {
  email: string;
  message: string;
}

function LandingPage() {
  const showToast = useCustomToast();
  const { register, handleSubmit, reset } = useForm<ContactFormInputs>();

  const handleEmail: SubmitHandler<ContactEmailSchema> = async (data) => {
    try {
      const response = await UtilsService.sendContactEmail({ requestBody: data });
      if (response) {
        showToast("Success!", "Message sent.", "success");
        reset();
      } else {
        showToast("Error", "Failed to send message.", "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      showToast("Error", "Failed to send message.", "error");
    }
  };

  return (
    <>
      <Container maxW="full" p={0} position="relative">
        {/* Top Left Logo */}
        {/*<Box position="absolute" top={4} left={4} zIndex={2}>*/}
        {/*  <Image src={LogoIcon} alt="MemriBox Logo" height="40px" />*/}
        {/*</Box>*/}

        {/* Hero Section */}
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="72vh"
          textAlign="center"
          bg="white"
          mt={20}
          zIndex={1}
        >
          <Image src={LogoText} alt="Memridex Logo" mb={4} />
          <Heading as="h1" fontSize="3.0vw" mb={4} color="#64a8a8">
            <Highlight
              query={["Everyone"]}
              styles={{ color: "#347387", textDecoration: "underline" }}
            >
              Everyone has a story to tell.
            </Highlight>
          </Heading>

          <Heading as="h1" fontSize="4.0vw" mb={4} color="#64a8a8">
            <Highlight
              query={["yours"]}
              styles={{ color: "#347387", fontWeight: "bold" }}
            >
              What's Yours?
            </Highlight>
          </Heading>
          <Flex>
            <Link to="/signup">
              <Button
                size="lg"
                colorScheme="teal"
                variant="solid"
                _hover={{ bg: "#81c4c4", color: "teal" }}
                mt={4}
                boxShadow="md"
                mr={4}
              >
                Sign Up
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                colorScheme="gray"
                color="#347387"
                variant="outline"
                _hover={{ bg: "#81c4c4", color: "teal" }}
                mt={4}
                boxShadow="md"
              >
                Log In
              </Button>
            </Link>
          </Flex>
        </Box>

        {/* Cards Section */}
        <Box
          position="relative"
          width="100%"
          paddingTop="100vh"
          bgGradient="linear(to-b, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))"
        >
          <Box
            backgroundImage="url('https://memribox-defaults.s3.amazonaws.com/site_assets/homepage_bg.png')"
            backgroundPosition="center"
            backgroundSize="cover"
            width="100%"
            height="100%"
            position="absolute"
            top={0}
            left={0}
            zIndex={-1}
          />
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            zIndex={1}
          >
            <SimpleGrid columns={[1, 2]} spacing={10}
                        justifyContent="flex-start"
                        // height="auto"
                        width="75vw">
              <Card maxW="sm" maxH="80" mt={-600} mr={10} zIndex={1} bg="transparent" boxShadow="md">
                <CardBody>
                  <Image
                    src="https://memribox-defaults.s3.amazonaws.com/site_assets/story-prompts.jpg"
                    alt="Card 1"
                    borderRadius="lg"
                  />
                  <Text fontSize="18px" color="#347387" fontWeight="bold" mt={4}>Choose from our list of story prompts.</Text>
                </CardBody>
              </Card>
              <Card maxW="sm" maxH="80" mt={-400} ml={10} zIndex={1} bg="transparent" boxShadow="md">
                <CardBody>
                  <Image
                    src="https://memribox-defaults.s3.amazonaws.com/site_assets/chat.jpg"
                    alt="Card 2"
                    borderRadius="lg"
                  />
                  <Text fontSize="18px" color="#347387" fontWeight="bold" mt={4}>Chat with our AI about it.</Text>
                </CardBody>
              </Card>
              <Card maxW="sm" maxH="80" mt={-200} mr={10} zIndex={1} bg="transparent" boxShadow="md">
                <CardBody>
                  <Image
                    src="https://memribox-defaults.s3.amazonaws.com/site_assets/ai-writer.jpg"
                    alt="Card 3"
                    borderRadius="lg"
                  />
                  <Text fontSize="18px" color="#347387" fontWeight="bold" mt={4}>Let our AI compile the chat into a story.</Text>
                </CardBody>
              </Card>
              <Card maxW="sm" maxH="80" mb={200} ml={10} zIndex={1} bg="transparent" boxShadow="md">
                <CardBody>
                  <Image
                    src="https://memribox-defaults.s3.amazonaws.com/site_assets/send.jpg"
                    alt="Card 4"
                    borderRadius="lg"
                  />
                  <Text fontSize="18px" color="#347387" fontWeight="bold" mt={4}>Send your story to friends and family.</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>
        </Box>

        {/* Contact Us Section */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          bg="#102C48"
          p={8}
          zIndex={1}
          height="60vh"
        >
          <VStack spacing={16} align="center" width="100%" maxW="lg" p={4} bg="white"
                  borderRadius="lg">
            <Heading as="h2" size="lg" color="#64a8a8">
              Contact Us
            </Heading>
            <form onSubmit={handleSubmit(handleEmail)}>
              <VStack spacing={4} width="350px" mt={-8}>
                <Input placeholder="Your Email"
                       size="md" {...register("email", {required: true})} />
                <Textarea placeholder="Your Message"
                          size="md" {...register("message", {required: true})} />
                <Button colorScheme="teal" variant="solid" type="submit">
                  Send Message
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>

        {/* Footer */}
        <Box textAlign="center" p={4} bg="#102C48" color="white">
          &copy; {new Date().getFullYear()} Memridex. All rights reserved.
        </Box>

      </Container>
    </>
  );
}

export default LandingPage;
