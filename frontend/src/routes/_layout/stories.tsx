import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/stories")({
  beforeLoad: () => {
    throw redirect({ to: "/conversations" })
  },
})
