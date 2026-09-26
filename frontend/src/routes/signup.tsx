import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  SimpleGrid,
  Stack,
  Text,
  useBoolean,
} from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiArrowRight } from "react-icons/fi"

import storyPromptsImage from "../assets/images/homepage_parallax/background.png"
import useAuth, { hasValidSession } from "../hooks/useAuth"
import { emailPattern } from "../utils"

interface SignupFormData {
  email: string
  password: string
  full_name: string
}

export const Route = createFileRoute("/signup")({
  component: Signup,
  beforeLoad: async () => {
    if (await hasValidSession()) {
      throw redirect({ to: "/" })
    }
  },
})

function Signup() {
  const [show, setShow] = useBoolean()
  const { signupMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
    },
  })

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await signupMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <SimpleGrid minH="100vh" columns={{ base: 1, lg: 2 }} bg="ui.light">
      <Box
        display={{ base: "none", lg: "block" }}
        bgImage={`linear-gradient(180deg, rgba(18, 30, 39, 0.18), rgba(18, 30, 39, 0.70)), url(${storyPromptsImage})`}
        bgSize="cover"
        bgPosition="center"
        color="white"
        p={10}
      >
        <Stack
          h="full"
          minH="calc(100vh - 80px)"
          justify="flex-end"
          spacing={5}
        >
          <Badge
            alignSelf="flex-start"
            bg="whiteAlpha.200"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.300"
            borderRadius="8px"
            px={3}
            py={1}
          >
            MemriPlace
          </Badge>
          <Heading
            fontSize="48px"
            lineHeight="1.08"
            letterSpacing={0}
            maxW="560px"
          >
            Everyone has a story to tell. What's yours?
          </Heading>
          <Text
            color="rgba(255, 255, 255, 0.85)"
            fontSize="xl"
            lineHeight="1.7"
            maxW="520px"
          >
            Choose from our list of story prompts, chat with our AI about it,
            and turn the conversation into a story worth sharing.
          </Text>
        </Stack>
      </Box>
      <Center px={{ base: 5, md: 10 }} py={12}>
        <Stack
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          spacing={5}
          w="full"
          maxW="430px"
        >
          <Text
            alignSelf="flex-start"
            color="ui.main"
            fontSize="3xl"
            fontWeight="bold"
            mb={2}
          >
            MemriPlace
          </Text>
          <Box>
            <Heading fontSize={{ base: "32px", md: "40px" }} letterSpacing={0}>
              Start preserving stories
            </Heading>
            <Text color="ui.muted" mt={3} fontSize="lg">
              Create a workspace for prompts, conversations, and finished
              memories.
            </Text>
          </Box>

          <FormControl id="email" isInvalid={!!errors.email || !!error}>
            <Input
              id="email"
              {...register("email", { pattern: emailPattern })}
              placeholder="Email"
              type="email"
              required
              bg="white"
              borderColor="ui.line"
              h="48px"
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="full_name" isInvalid={!!errors.full_name}>
            <Input
              id="full_name"
              {...register("full_name", { required: "Full name is required" })}
              placeholder="Full name"
              type="text"
              required
              bg="white"
              borderColor="ui.line"
              h="48px"
            />
            {errors.full_name && (
              <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!error}>
            <InputGroup>
              <Input
                {...register("password")}
                type={show ? "text" : "password"}
                placeholder="Password"
                required
                bg="white"
                borderColor="ui.line"
                h="48px"
              />
              <InputRightElement
                color="ui.dim"
                h="48px"
                _hover={{ cursor: "pointer" }}
              >
                <Icon
                  onClick={setShow.toggle}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <ViewOffIcon /> : <ViewIcon />}
                </Icon>
              </InputRightElement>
            </InputGroup>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<FiArrowRight />}
            h="48px"
          >
            Sign up
          </Button>
          <Center>
            <Text color="ui.muted">
              Already have an account?{" "}
              <Link
                as={RouterLink}
                to="/login"
                color="ui.mainDark"
                fontWeight="bold"
              >
                Log in
              </Link>
            </Text>
          </Center>
        </Stack>
      </Center>
    </SimpleGrid>
  )
}

export default Signup
