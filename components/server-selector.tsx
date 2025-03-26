"use client"

import { useServer, FHIR_SERVERS } from "@/contexts/server-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, RefreshCw } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ServerSelector() {
  const { serverUrl, setServerUrl } = useServer()
  const [changing, setChanging] = useState(false)

  const handleServerChange = (newServerUrl) => {
    setChanging(true)
    setServerUrl(newServerUrl)

    // Visual feedback that server is changing
    setTimeout(() => {
      setChanging(false)
    }, 500)
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {changing ? (
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <Database className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Changing the server will affect all searches and data retrieval</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select value={serverUrl} onValueChange={handleServerChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select FHIR server" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FHIR_SERVERS.FHIRLAB}>FHIRLAB Server</SelectItem>
          <SelectItem value={FHIR_SERVERS.UPMSILAB}>UPMSILAB Server</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

