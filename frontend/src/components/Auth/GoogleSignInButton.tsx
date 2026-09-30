import { Box, Text } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"

import { GOOGLE_CLIENT_ID } from "../../config"

interface CredentialResponse {
  credential: string
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: CredentialResponse) => void
      }) => void
      renderButton: (
        element: HTMLElement,
        options: Record<string, string | number>,
      ) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

let googleScript: Promise<void> | undefined

function loadGoogleScript(): Promise<void> {
  if (window.google) return Promise.resolve()
  if (!googleScript) {
    googleScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Google sign-in could not load"))
      document.head.appendChild(script)
    }).catch((error) => {
      googleScript = undefined
      throw error
    })
  }
  return googleScript
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void
  label?: "signin_with" | "signup_with" | "continue_with"
}

export default function GoogleSignInButton({
  onCredential,
  label = "continue_with",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  const [loadError, setLoadError] = useState(false)

  callbackRef.current = onCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let active = true
    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current || !window.google) return
        buttonRef.current.replaceChildren()
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => callbackRef.current(credential),
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: label,
          width: Math.min(buttonRef.current.clientWidth || 320, 360),
        })
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [label])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <Box width="100%">
      <Box ref={buttonRef} display="flex" justifyContent="center" minH="44px" />
      {loadError && (
        <Text color="red.600" fontSize="sm" mt={2} textAlign="center">
          Google sign-in could not load. Please try email and password.
        </Text>
      )}
    </Box>
  )
}
