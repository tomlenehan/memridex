import { createFileRoute } from "@tanstack/react-router"

import LegalPage from "../components/Common/LegalPage"

export const Route = createFileRoute("/privacy")({
  component: () => <LegalPage kind="privacy" />,
})
