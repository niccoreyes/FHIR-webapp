"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { fetchConditionsForEncounter } from "@/lib/fhir-service"
import { Calendar, MapPin, ChevronDown, ChevronUp, User } from "lucide-react"

export default function EncounterList({ encounters, patientId }) {
  const [expandedEncounter, setExpandedEncounter] = useState(null)
  const [conditions, setConditions] = useState({})
  const [loading, setLoading] = useState({})

  const toggleEncounter = async (encounterId) => {
    if (expandedEncounter === encounterId) {
      setExpandedEncounter(null)
      return
    }

    setExpandedEncounter(encounterId)

    // Only fetch conditions if we haven't already
    if (!conditions[encounterId] && !loading[encounterId]) {
      try {
        setLoading((prev) => ({ ...prev, [encounterId]: true }))
        const encounterConditions = await fetchConditionsForEncounter(encounterId)
        setConditions((prev) => ({ ...prev, [encounterId]: encounterConditions }))
      } catch (error) {
        console.error(`Error fetching conditions for encounter ${encounterId}:`, error)
        setConditions((prev) => ({ ...prev, [encounterId]: [] }))
      } finally {
        setLoading((prev) => ({ ...prev, [encounterId]: false }))
      }
    }
  }

  if (encounters.length === 0) {
    return <div className="text-center py-4">No encounters found for this patient.</div>
  }

  return (
    <div className="space-y-4">
      {encounters.map((encounter) => {
        const status = encounter.status?.charAt(0).toUpperCase() + encounter.status?.slice(1) || "Unknown"
        const encounterDate = encounter.period?.start || encounter.period?.end || encounter.date
        const formattedDate = encounterDate ? new Date(encounterDate).toLocaleString() : "Unknown date"
        const location = encounter.location?.[0]?.location?.display || "Unknown location"
        const type = encounter.type?.[0]?.coding?.[0]?.display || "Unknown type"
        const practitioner =
          encounter.participant?.find((p) => p.individual?.reference?.startsWith("Practitioner/"))?.individual
            ?.display || "Unknown provider"

        return (
          <Collapsible
            key={encounter.id}
            open={expandedEncounter === encounter.id}
            onOpenChange={() => toggleEncounter(encounter.id)}
          >
            <Card className={expandedEncounter === encounter.id ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{type}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formattedDate}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      className={
                        encounter.status === "finished"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : encounter.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : encounter.status === "planned"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {status}
                    </Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                        {expandedEncounter === encounter.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="font-medium">Location:</span>
                        <span className="ml-2">{location}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Provider:</span>
                        <span className="ml-2">{practitioner}</span>
                      </div>
                    </div>
                    <div>
                      {encounter.reasonCode && encounter.reasonCode.length > 0 && (
                        <div>
                          <span className="font-medium">Reason:</span>
                          <div className="mt-1">
                            {encounter.reasonCode.map((reason, index) => (
                              <Badge key={index} variant="outline" className="mr-2 mb-2">
                                {reason.coding?.[0]?.display || reason.text || "Unknown reason"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Conditions</h4>
                    {loading[encounter.id] ? (
                      <div className="text-center py-2">Loading conditions...</div>
                    ) : conditions[encounter.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {conditions[encounter.id].map((condition) => (
                          <div key={condition.id} className="p-2 border rounded-md">
                            <div className="font-medium">
                              {condition.code?.coding?.[0]?.display || condition.code?.text || "Unknown condition"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {condition.clinicalStatus?.coding?.[0]?.code === "active" ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  {condition.clinicalStatus?.coding?.[0]?.code || "Unknown status"}
                                </Badge>
                              )}
                              {condition.recordedDate && (
                                <span className="ml-2">
                                  Recorded: {new Date(condition.recordedDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2">No conditions associated with this encounter.</div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}

