import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type UserPublic,
  type UserUpdateMe,
  UsersService,
} from "../../client"
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../../config"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern } from "../../utils"
import GoogleSignInButton from "../Auth/GoogleSignInButton"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const color = useColorModeValue("inherit", "ui.light")
  const showToast = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()
  const googleStatus = useQuery({
    queryKey: ["googleConnection"],
    enabled: Boolean(GOOGLE_CLIENT_ID),
    queryFn: async () => {
      const response = await axios.get<{ connected: boolean }>(
        `${API_BASE_URL}/api/v1/login/google/status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      return response.data.connected
    },
  })
  const linkGoogle = useMutation({
    mutationFn: async (credential: string) => {
      await axios.post(
        `${API_BASE_URL}/api/v1/login/google/link`,
        { credential },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
    },
    onSuccess: () => {
      setGoogleError(null)
      queryClient.invalidateQueries({ queryKey: ["googleConnection"] })
      showToast("Connected", "You can now sign in with Google.", "success")
    },
    onError: (error: unknown) => {
      const detail = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: unknown })?.detail
        : undefined
      setGoogleError(
        typeof detail === "string"
          ? detail
          : "Could not connect Google. Please try again.",
      )
    },
  })
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success")
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
    onSettled: () => {
      // TODO: can we do just one call now?
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  return (
    <>
      <Container maxW="full" as="form" onSubmit={handleSubmit(onSubmit)}>
        <Heading size="sm" py={4}>
          User Information
        </Heading>
        <Box w={{ sm: "full", md: "50%" }}>
          <FormControl>
            <FormLabel color={color} htmlFor="name">
              Full name
            </FormLabel>
            {editMode ? (
              <Input
                id="name"
                {...register("full_name", { maxLength: 30 })}
                type="text"
                size="md"
              />
            ) : (
              <Text
                size="md"
                py={2}
                color={!currentUser?.full_name ? "ui.dim" : "inherit"}
              >
                {currentUser?.full_name || "N/A"}
              </Text>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.email}>
            <FormLabel color={color} htmlFor="email">
              Email
            </FormLabel>
            {editMode ? (
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                type="email"
                size="md"
              />
            ) : (
              <Text size="md" py={2}>
                {currentUser?.email}
              </Text>
            )}
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
          <Flex mt={4} gap={3}>
            <Button
              variant="primary"
              onClick={toggleEditMode}
              type={editMode ? "button" : "submit"}
              isLoading={editMode ? isSubmitting : false}
              isDisabled={editMode ? !isDirty || !getValues("email") : false}
            >
              {editMode ? "Save" : "Edit"}
            </Button>
            {editMode && (
              <Button
                variant="outline"
                onClick={onCancel}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </Flex>
        </Box>
      </Container>
      {GOOGLE_CLIENT_ID && (
        <Box borderTop="1px solid" borderColor="ui.line" mt={6} pt={6}>
          <Heading size="sm" mb={2}>
            Google sign-in
          </Heading>
          {googleStatus.isPending ? (
            <Text color="ui.muted">Checking connection...</Text>
          ) : googleStatus.data ? (
            <Text color="ui.muted">
              Connected. You can use Google to sign in.
            </Text>
          ) : (
            <>
              <Text color="ui.muted" mb={4}>
                Connect the Google account with your MemriPlace email.
              </Text>
              <Box maxW="360px">
                <GoogleSignInButton
                  onCredential={(credential) => {
                    setGoogleError(null)
                    if (!linkGoogle.isPending) linkGoogle.mutate(credential)
                  }}
                />
              </Box>
              {googleError && (
                <Alert mt={3} status="error" maxW="500px">
                  <AlertIcon />
                  {googleError}
                </Alert>
              )}
            </>
          )}
        </Box>
      )}
    </>
  )
}

export default UserInformation
