"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define available servers
export const FHIR_SERVERS = {
  FHIRLAB: "https://cdr.fhirlab.net/fhir",
  UPMSILAB: "https://cdr.upmsilab.org/fhir",
}

type ServerContextType = {
  serverUrl: string
  setServerUrl: (url: string) => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export function ServerProvider({ children }: { children: ReactNode }) {
  // Default to UPMSILAB server
  const [serverUrl, setServerUrl] = useState<string>(FHIR_SERVERS.FHIRLAB)

  // Store the selected server in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fhir-server-url", serverUrl)
    }
  }, [serverUrl])

  // Load the server from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedServer = localStorage.getItem("fhir-server-url")
      if (savedServer && Object.values(FHIR_SERVERS).includes(savedServer)) {
        setServerUrl(savedServer)
      }
    }
  }, [])

  return <ServerContext.Provider value={{ serverUrl, setServerUrl }}>{children}</ServerContext.Provider>
}

export function useServer() {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error("useServer must be used within a ServerProvider")
  }
  return context
}

