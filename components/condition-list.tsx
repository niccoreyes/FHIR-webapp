"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Activity } from "lucide-react"

export default function ConditionList({ conditions, patientId }) {
  if (conditions.length === 0) {
    return <div className="text-center py-4">No conditions found for this patient.</div>
  }

  // Group conditions by clinical status
  const activeConditions = conditions.filter((c) => c.clinicalStatus?.coding?.[0]?.code === "active")

  const resolvedConditions = conditions.filter((c) => c.clinicalStatus?.coding?.[0]?.code === "resolved")

  const otherConditions = conditions.filter(
    (c) => c.clinicalStatus?.coding?.[0]?.code !== "active" && c.clinicalStatus?.coding?.[0]?.code !== "resolved",
  )

  const renderCondition = (condition) => {
    const conditionName = condition.code?.coding?.[0]?.display || condition.code?.text || "Unknown condition"
    const recordedDate = condition.recordedDate ? new Date(condition.recordedDate).toLocaleDateString() : "Unknown date"
    const severity = condition.severity?.coding?.[0]?.display || null
    const bodySite = condition.bodySite?.[0]?.coding?.[0]?.display || null
    const encounter = condition.encounter?.reference || null

    return (
      <Card key={condition.id} className="mb-4">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{conditionName}</h4>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Recorded: {recordedDate}
              </div>
            </div>
            <Badge
              className={
                condition.clinicalStatus?.coding?.[0]?.code === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : condition.clinicalStatus?.coding?.[0]?.code === "resolved"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {condition.clinicalStatus?.coding?.[0]?.code?.charAt(0).toUpperCase() +
                condition.clinicalStatus?.coding?.[0]?.code?.slice(1) || "Unknown"}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {severity && (
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  <span className="font-medium">Severity:</span> {severity}
                </span>
              </div>
            )}

            {bodySite && (
              <div className="text-sm">
                <span className="font-medium">Body Site:</span> {bodySite}
              </div>
            )}

            {condition.note?.length > 0 && (
              <div className="col-span-2 text-sm mt-2">
                <span className="font-medium">Notes:</span>
                <div className="mt-1">
                  {condition.note.map((note, index) => (
                    <div key={index} className="p-2 bg-muted rounded-md">
                      {note.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {activeConditions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Active Conditions</h3>
          {activeConditions.map(renderCondition)}
        </div>
      )}

      {resolvedConditions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Resolved Conditions</h3>
          {resolvedConditions.map(renderCondition)}
        </div>
      )}

      {otherConditions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Other Conditions</h3>
          {otherConditions.map(renderCondition)}
        </div>
      )}
    </div>
  )
}

