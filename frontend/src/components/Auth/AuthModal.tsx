import {
  Alert,
  AlertIcon,
  Button,
  Divider,
  Flex,
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
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import memriPlaceLogo from "../../assets/images/MemriPlaceLighterLogo.png"
import { ApiError, LoginService } from "../../client"
import { GOOGLE_CLIENT_ID } from "../../config"
import useAuth from "../../hooks/useAuth"
import { emailPattern, passwordRules } from "../../utils"
import GoogleSignInButton from "./GoogleSignInButton"

type AuthMode = "login" | "signup" | "recover"

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
  const {
    loginMutation,
    googleLoginMutation,
    signupMutation,
    error,
    resetError,
  } = useAuth()
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [recoverySent, setRecoverySent] = useState(false)
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
    setRecoveryError(null)

    try {
      if (mode === "recover") {
        await LoginService.recoverPassword({ email: data.email })
        setRecoverySent(true)
      } else if (mode === "signup") {
        await signupMutation.mutateAsync(data)
      } else {
        await loginMutation.mutateAsync({
          username: data.email,
          password: data.password,
        })
      }
    } catch (error) {
      if (mode === "recover") {
        handleRecoveryError(error)
      }
      // The auth hook provides login and signup errors.
    }
  }

  const isSignup = mode === "signup"
  const isRecovery = mode === "recover"

  const handleRecoveryError = (error: unknown) => {
    if (error instanceof ApiError) {
      const detail = (error.body as { detail?: unknown } | null)?.detail
      if (typeof detail === "string") {
        setRecoveryError(detail)
        return
      }
    }
    setRecoveryError(
      "We couldn't send the recovery email right now. Please try again.",
    )
  }

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
          {isRecovery
            ? "Get back into your account"
            : isSignup
              ? "Start preserving stories"
              : "Welcome back"}
        </ModalHeader>
        <ModalCloseButton color="#526A70" top={5} />
        <ModalBody pb={3}>
          {/*<Text color="#526A70" mb={6}>*/}
          {/*  {isSignup*/}
          {/*    ? "Create your free MemriPlace account."*/}
          {/*    : "Pick up the memories you have already started."}*/}
          {/*</Text>*/}
          {!isRecovery && GOOGLE_CLIENT_ID && (
            <>
              <GoogleSignInButton
                label={mode === "signup" ? "signup_with" : "signin_with"}
                onCredential={(credential) => {
                  resetError()
                  if (!googleLoginMutation.isPending) {
                    googleLoginMutation.mutate(credential)
                  }
                }}
              />
              <Flex align="center" gap={3} my={5}>
                <Divider borderColor="#D7CFAF" />
                <Text color="#526A70" fontSize="sm" whiteSpace="nowrap">
                  or use email
                </Text>
                <Divider borderColor="#D7CFAF" />
              </Flex>
            </>
          )}
          {isRecovery && recoverySent ? (
            <Stack spacing={5} py={2}>
              <Alert borderRadius="8px" status="success">
                <AlertIcon />
                Check your inbox for a password recovery link.
              </Alert>
              <Text color="#526A70" textAlign="center">
                If an account exists for that email, the message should arrive
                shortly.
              </Text>
            </Stack>
          ) : (
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
                  <FormErrorMessage>
                    {errors.full_name?.message}
                  </FormErrorMessage>
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
              {!isRecovery && (
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
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    bg="white"
                    borderColor="#D7CFAF"
                    id="auth-password"
                    placeholder={
                      isSignup ? "At least 8 characters" : "Password"
                    }
                    type="password"
                  />
                  <FormErrorMessage>
                    {errors.password?.message}
                  </FormErrorMessage>
                </FormControl>
              )}
              {(error || recoveryError) && (
                <Alert borderRadius="6px" status="error">
                  <AlertIcon />
                  {error || recoveryError}
                </Alert>
              )}
              {!isSignup && !isRecovery && (
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
              <Button variant="accent" isLoading={isSubmitting} type="submit">
                {isRecovery
                  ? "Send recovery email"
                  : isSignup
                    ? "Create account"
                    : "Log in"}
              </Button>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter justifyContent="center" pb={7}>
          <Text color="#526A70">
            {isRecovery
              ? "Remembered your password? "
              : isSignup
                ? "Already have an account? "
                : "New to MemriPlace? "}
            <Button
              as={Link}
              color="#2E7A78"
              fontWeight="bold"
              h="auto"
              p={0}
              to={isRecovery ? "/login" : isSignup ? "/login" : "/signup"}
              variant="link"
            >
              {isRecovery
                ? "Log in"
                : isSignup
                  ? "Log in"
                  : "Create an account"}
            </Button>
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AuthModal
