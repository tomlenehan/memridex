import { createFileRoute, redirect } from "@tanstack/react-router"

import { hasValidSession } from "../hooks/useAuth"
import { LandingPage } from "./landing"

export const Route = createFileRoute("/recover-password")({
  component: RecoverPasswordModalRoute,
  beforeLoad: async () => {
    if (await hasValidSession()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function RecoverPasswordModalRoute() {
  return <LandingPage initialAuthMode="recover" />
}
