import { createFileRoute, redirect } from "@tanstack/react-router"

import { hasValidSession } from "../hooks/useAuth"
import { LandingPage } from "./landing"

export const Route = createFileRoute("/signup")({
  component: SignupModalRoute,
  beforeLoad: async () => {
    if (await hasValidSession()) {
      throw redirect({ to: "/" })
    }
  },
})

function SignupModalRoute() {
  return <LandingPage initialAuthMode="signup" />
}

export default SignupModalRoute
