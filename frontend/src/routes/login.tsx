import { createFileRoute, redirect } from "@tanstack/react-router"

import { hasValidSession } from "../hooks/useAuth"
import { LandingPage } from "./landing"

export const Route = createFileRoute("/login")({
  component: LoginModalRoute,
  beforeLoad: async () => {
    if (await hasValidSession()) {
      throw redirect({ to: "/conversations" })
    }
  },
})

function LoginModalRoute() {
  return <LandingPage initialAuthMode="login" />
}

export default LoginModalRoute
