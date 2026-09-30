import { createFileRoute } from "@tanstack/react-router"

import LegalPage from "../components/Common/LegalPage"

export const Route = createFileRoute("/terms")({
  component: () => <LegalPage kind="terms" />,
})
