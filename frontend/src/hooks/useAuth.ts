import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { AxiosError } from "axios"
import {
  type Body_login_login_access_token as AccessToken,
  ApiError,
  LoginService,
  type UserCreate as SignupData,
  type UserPublic,
  UsersService,
} from "../client"

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

const useAuth = () => {
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
    localStorage.setItem("access_token", response.access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/conversations" })
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong"
      }

      setError(errDetail)
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
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong"
      }

      setError(errDetail)
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  return {
    loginMutation,
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
