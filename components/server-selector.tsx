"use client"

import { useServer, FHIR_SERVERS } from "@/contexts/server-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "lucide-react"

export default function ServerSelector() {
  const { serverUrl, setServerUrl } = useServer()

  return (
    <div className="flex items-center gap-2">
      <Database className="h-4 w-4 text-muted-foreground" />
      <Select value={serverUrl} onValueChange={setServerUrl}>
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

