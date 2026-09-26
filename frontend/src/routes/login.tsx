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

import chatImage from "../assets/images/homepage_parallax/background.png"
import type { Body_login_login_access_token as AccessToken } from "../client"
import useAuth, { hasValidSession } from "../hooks/useAuth"
import { emailPattern } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (await hasValidSession()) {
      throw redirect({
        to: "/conversations",
      })
    }
  },
})

function Login() {
  const [show, setShow] = useBoolean()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <SimpleGrid minH="100vh" columns={{ base: 1, lg: 2 }} bg="ui.light">
      <Box
        display={{ base: "none", lg: "block" }}
        bgImage={`linear-gradient(180deg, rgba(18, 30, 39, 0.24), rgba(18, 30, 39, 0.72)), url(${chatImage})`}
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
            Return to your prompts, conversations, and finished memories exactly
            where you left them.
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
              Welcome back
            </Heading>
            <Text color="ui.muted" mt={3} fontSize="lg">
              Pick up the memories you have already started.
            </Text>
          </Box>

          <FormControl id="username" isInvalid={!!errors.username || !!error}>
            <Input
              id="username"
              {...register("username", {
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              required
              bg="white"
              borderColor="ui.line"
              h="48px"
            />
            {errors.username && (
              <FormErrorMessage>{errors.username.message}</FormErrorMessage>
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
                _hover={{
                  cursor: "pointer",
                }}
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
          <Link
            as={RouterLink}
            to="/recover-password"
            color="ui.mainDark"
            fontWeight="bold"
            alignSelf="flex-start"
          >
            Forgot password?
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<FiArrowRight />}
            h="48px"
          >
            Log in
          </Button>
          <Center>
            <Text color="ui.muted">
              New here?{" "}
              <Link
                as={RouterLink}
                to="/signup"
                color="ui.mainDark"
                fontWeight="bold"
              >
                Create an account
              </Link>
            </Text>
          </Center>
        </Stack>
      </Center>
    </SimpleGrid>
  )
}
