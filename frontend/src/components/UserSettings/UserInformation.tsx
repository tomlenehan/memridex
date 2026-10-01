import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { type ChangeEvent, useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiCamera, FiEdit3, FiTrash2 } from "react-icons/fi"

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
import { profileImageSrc } from "../../utils/profileImage"
import GoogleSignInButton from "../Auth/GoogleSignInButton"

const acceptedPhotoTypes = ["image/jpeg", "image/png", "image/webp"]
const maxPhotoBytes = 5 * 1024 * 1024

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
})

const UserInformation = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()
  const displayName =
    currentUser?.full_name || currentUser?.email || "Your account"

  const googleStatus = useQuery({
    queryKey: ["googleConnection"],
    enabled: Boolean(GOOGLE_CLIENT_ID),
    queryFn: async () => {
      const response = await axios.get<{ connected: boolean }>(
        `${API_BASE_URL}/api/v1/login/google/status`,
        { headers: authHeaders() },
      )
      return response.data.connected
    },
  })

  const linkGoogle = useMutation({
    mutationFn: async (credential: string) => {
      await axios.post(
        `${API_BASE_URL}/api/v1/login/google/link`,
        { credential },
        { headers: authHeaders() },
      )
    },
    onSuccess: () => {
      setGoogleError(null)
      queryClient.invalidateQueries({ queryKey: ["googleConnection"] })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
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

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append("image", file)
      const response = await axios.post<UserPublic>(
        `${API_BASE_URL}/api/v1/users/me/profile-image`,
        body,
        { headers: authHeaders() },
      )
      return response.data
    },
    onSuccess: (user) => {
      setPhotoError(null)
      queryClient.setQueryData(["currentUser"], user)
      showToast("Photo updated", "Your new profile photo is ready.", "success")
    },
    onError: (error: unknown) => {
      const detail = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: unknown })?.detail
        : undefined
      setPhotoError(
        typeof detail === "string"
          ? detail
          : "We could not upload that photo. Please try again.",
      )
    },
  })

  const removePhoto = useMutation({
    mutationFn: async () => {
      const response = await axios.delete<UserPublic>(
        `${API_BASE_URL}/api/v1/users/me/profile-image`,
        { headers: authHeaders() },
      )
      return response.data
    },
    onSuccess: (user) => {
      setPhotoError(null)
      queryClient.setQueryData(["currentUser"], user)
      showToast(
        "Photo removed",
        "Your initials will be shown instead.",
        "success",
      )
    },
    onError: () => {
      setPhotoError("We could not remove the photo. Please try again.")
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserUpdateMe>({
    mode: "onBlur",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const updateProfile = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      reset({ full_name: user.full_name, email: user.email })
      setEditMode(false)
      showToast(
        "Profile updated",
        "Your account details were saved.",
        "success",
      )
    },
    onError: (error: ApiError) => {
      const detail = (error.body as { detail?: unknown } | null)?.detail
      showToast(
        "Could not save changes",
        typeof detail === "string" ? detail : "Please try again.",
        "error",
      )
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = (data) => {
    updateProfile.mutate(data)
  }

  const onPhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!acceptedPhotoTypes.includes(file.type)) {
      setPhotoError("Choose a PNG, JPEG, or WebP image.")
      return
    }
    if (file.size > maxPhotoBytes) {
      setPhotoError("Profile photos must be 5 MB or smaller.")
      return
    }
    setPhotoError(null)
    uploadPhoto.mutate(file)
  }

  return (
    <Stack spacing={8}>
      <Box
        bg="#F3F7F0"
        border="1px solid"
        borderColor="ui.line"
        borderRadius="8px"
        p={{ base: 4, md: 5 }}
      >
        <Flex
          align={{ base: "flex-start", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
          gap={5}
        >
          <Avatar
            name={displayName}
            src={profileImageSrc(currentUser?.profile_image_url)}
            size="xl"
            bg="#DDE5D9"
            color="#17353B"
            border="3px solid white"
            boxShadow="0 5px 14px rgba(31, 94, 92, .15)"
          />
          <Box flex="1">
            <Heading size="sm">Profile photo</Heading>
            <Text color="ui.muted" mt={1} mb={4}>
              This photo appears in your account and beside your level.
            </Text>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              display="none"
              onChange={onPhotoSelected}
            />
            <HStack spacing={3} flexWrap="wrap">
              <Button
                variant="primary"
                leftIcon={<FiCamera />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploadPhoto.isPending}
                loadingText="Uploading"
              >
                {currentUser?.profile_image_url
                  ? "Change photo"
                  : "Upload photo"}
              </Button>
              {currentUser?.profile_image_url && (
                <Button
                  variant="ghost"
                  color="ui.danger"
                  leftIcon={<FiTrash2 />}
                  onClick={() => removePhoto.mutate()}
                  isLoading={removePhoto.isPending}
                >
                  Remove
                </Button>
              )}
            </HStack>
            <Text color="ui.muted" fontSize="sm" mt={3}>
              PNG, JPEG, or WebP. Maximum 5 MB.
            </Text>
            {photoError && (
              <Alert status="error" mt={3} borderRadius="8px" maxW="560px">
                <AlertIcon />
                {photoError}
              </Alert>
            )}
          </Box>
        </Flex>
      </Box>

      <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <Flex align="center" justify="space-between" gap={4} mb={5}>
          <Box>
            <Heading size="sm">Personal details</Heading>
            <Text color="ui.muted" mt={1}>
              Keep your name and sign-in email up to date.
            </Text>
          </Box>
          {!editMode && (
            <Button leftIcon={<FiEdit3 />} onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} maxW="820px">
          <FormControl>
            <FormLabel htmlFor="name">Full name</FormLabel>
            {editMode ? (
              <Input id="name" {...register("full_name", { maxLength: 80 })} />
            ) : (
              <Text
                py={3}
                color={!currentUser?.full_name ? "ui.dim" : "inherit"}
              >
                {currentUser?.full_name || "Not added"}
              </Text>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel htmlFor="email">Email</FormLabel>
            {editMode ? (
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                type="email"
              />
            ) : (
              <Text py={3}>{currentUser?.email}</Text>
            )}
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
        </SimpleGrid>
        {editMode && (
          <HStack mt={5} spacing={3}>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfile.isPending}
              isDisabled={!isDirty}
            >
              Save changes
            </Button>
            <Button
              type="button"
              onClick={() => {
                reset()
                setEditMode(false)
              }}
              isDisabled={updateProfile.isPending}
            >
              Cancel
            </Button>
          </HStack>
        )}
      </Box>

      {GOOGLE_CLIENT_ID && (
        <Box>
          <Divider mb={7} />
          <Heading size="sm" mb={2}>
            Google sign-in
          </Heading>
          {googleStatus.isPending ? (
            <Text color="ui.muted">Checking connection...</Text>
          ) : googleStatus.data ? (
            <Text color="ui.muted">
              Connected. You can use Google to sign in, and its profile photo is
              used when you have not uploaded one.
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
                <Alert mt={3} status="error" maxW="500px" borderRadius="8px">
                  <AlertIcon />
                  {googleError}
                </Alert>
              )}
            </>
          )}
        </Box>
      )}
    </Stack>
  )
}

export default UserInformation
