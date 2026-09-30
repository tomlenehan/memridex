import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { AxiosError } from "axios"
import axios from "axios"
import {
  type Body_login_login_access_token as AccessToken,
  ApiError,
  LoginService,
  type UserCreate as SignupData,
  type UserPublic,
  UsersService,
} from "../client"
import { API_BASE_URL } from "../config"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const hasValidSession = async () => {
  if (!isLoggedIn()) return false

  try {
    await UsersService.readUserMe()
    return true
  } catch (error) {
    if (
      error instanceof ApiError &&
      [400, 401, 403, 404].includes(error.status)
    ) {
      localStorage.removeItem("access_token")
    }
    return false
  }
}

const getAuthErrorMessage = (
  error: unknown,
  action: "login" | "signup",
): string => {
  if (error instanceof ApiError) {
    if ([502, 503, 504].includes(error.status) || error.status >= 500) {
      return "MemriPlace is temporarily unavailable. Please try again in a few minutes."
    }

    if (action === "login" && [400, 401].includes(error.status)) {
      return "That email and password don't match. Please check them and try again."
    }

    const detail = (error.body as { detail?: unknown } | null)?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      return "Please check the information you entered and try again."
    }
  }

  if (error instanceof AxiosError) {
    if (error.response) {
      if (error.response.status >= 500) {
        return "MemriPlace is temporarily unavailable. Please try again in a few minutes."
      }
      const detail = (error.response.data as { detail?: unknown })?.detail
      if (typeof detail === "string") return detail
    }
    return "We couldn't connect to MemriPlace. Check your internet connection and try again."
  }

  return action === "login"
    ? "We couldn't log you in just now. Please try again."
    : "We couldn't create your account just now. Please try again."
}

const useAuth = () => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: user, isLoading } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  })

  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      formData: data,
    })
    queryClient.clear()
    localStorage.setItem("access_token", response.access_token)
  }

  const googleLoginMutation = useMutation({
    mutationFn: async (credential: string) => {
      const response = await axios.post<{ access_token: string }>(
        `${API_BASE_URL}/api/v1/login/google`,
        { credential },
      )
      queryClient.clear()
      localStorage.setItem("access_token", response.data.access_token)
    },
    onSuccess: () => {
      navigate({ to: "/conversations" })
    },
    onError: (err: unknown) => {
      setError(getAuthErrorMessage(err, "login"))
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/conversations" })
    },
    onError: (err: unknown) => {
      setError(getAuthErrorMessage(err, "login"))
    },
  })

  const signup = async (data: SignupData) => {
    const response = await UsersService.createUser({ requestBody: data })
    return response
  }

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (err: unknown) => {
      setError(getAuthErrorMessage(err, "signup"))
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    queryClient.clear()
    navigate({ to: "/login" })
  }

  return {
    loginMutation,
    googleLoginMutation,
    signupMutation,
    logout,
    user,
    isLoading,
    error,
    resetError: () => setError(null),
  }
}

export { hasValidSession, isLoggedIn }
export default useAuth
