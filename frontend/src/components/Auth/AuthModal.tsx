import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

import memriPlaceLogo from "../../assets/images/MemriPlaceMLogoLG.png"
import useAuth from "../../hooks/useAuth"
import { emailPattern, passwordRules } from "../../utils"

type AuthMode = "login" | "signup"

interface AuthFormData {
  email: string
  full_name: string
  password: string
}

interface AuthModalProps {
  isOpen: boolean
  mode: AuthMode
  onClose: () => void
}

function AuthModal({ isOpen, mode, onClose }: AuthModalProps) {
  const { loginMutation, signupMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    mode: "onBlur",
    defaultValues: { email: "", full_name: "", password: "" },
  })

  const onSubmit: SubmitHandler<AuthFormData> = async (data) => {
    resetError()

    try {
      if (mode === "signup") {
        await signupMutation.mutateAsync(data)
      } else {
        await loginMutation.mutateAsync({
          username: data.email,
          password: data.password,
        })
      }
    } catch {
      // The auth hook provides the form error.
    }
  }

  const isSignup = mode === "signup"

  return (
    <Modal
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
      size="md"
    >
      <ModalOverlay bg="rgba(3, 19, 24, 0.72)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="#FFFDF6"
        borderRadius="12px"
        maxH="calc(100vh - 32px)"
        mx={4}
      >
        <ModalHeader color="#12313A" fontFamily="Georgia, serif" pb={1} pt={8}>
          <Image
            alt=""
            aria-hidden="true"
            boxSize="56px"
            mb={4}
            mx="auto"
            objectFit="contain"
            src={memriPlaceLogo}
          />
          {isSignup ? "Start preserving stories" : "Welcome back"}
        </ModalHeader>
        <ModalCloseButton color="#526A70" top={5} />
        <ModalBody pb={3}>
          <Text color="#526A70" mb={6}>
            {isSignup
              ? "Create your free MemriPlace account."
              : "Pick up the memories you have already started."}
          </Text>
          <Stack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
            {isSignup && (
              <FormControl isInvalid={!!errors.full_name}>
                <FormLabel color="#12313A" htmlFor="auth-full-name">
                  Full name
                </FormLabel>
                <Input
                  {...register("full_name", {
                    required: "Full name is required",
                  })}
                  autoComplete="name"
                  bg="white"
                  borderColor="#D7CFAF"
                  id="auth-full-name"
                  placeholder="Your name"
                />
                <FormErrorMessage>{errors.full_name?.message}</FormErrorMessage>
              </FormControl>
            )}
            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="#12313A" htmlFor="auth-email">
                Email
              </FormLabel>
              <Input
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                autoComplete="email"
                bg="white"
                borderColor="#D7CFAF"
                id="auth-email"
                placeholder="you@example.com"
                type="email"
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel color="#12313A" htmlFor="auth-password">
                Password
              </FormLabel>
              <Input
                {...register(
                  "password",
                  isSignup
                    ? passwordRules()
                    : { required: "Password is required" },
                )}
                autoComplete={isSignup ? "new-password" : "current-password"}
                bg="white"
                borderColor="#D7CFAF"
                id="auth-password"
                placeholder={isSignup ? "At least 8 characters" : "Password"}
                type="password"
              />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            {error && (
              <Alert borderRadius="6px" status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}
            {!isSignup && (
              <Button
                alignSelf="flex-start"
                as={Link}
                color="#2E7A78"
                fontWeight="semibold"
                h="auto"
                p={0}
                to="/recover-password"
                variant="link"
              >
                Forgot password?
              </Button>
            )}
            <Button
              _hover={{ bg: "#FFE5A5" }}
              bg="#F1CC77"
              color="#0C2830"
              isLoading={isSubmitting}
              type="submit"
            >
              {isSignup ? "Create account" : "Log in"}
            </Button>
          </Stack>
        </ModalBody>
        <ModalFooter justifyContent="center" pb={7}>
          <Text color="#526A70">
            {isSignup ? "Already have an account? " : "New to MemriPlace? "}
            <Button
              as={Link}
              color="#2E7A78"
              fontWeight="bold"
              h="auto"
              p={0}
              to={isSignup ? "/login" : "/signup"}
              variant="link"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Button>
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AuthModal
