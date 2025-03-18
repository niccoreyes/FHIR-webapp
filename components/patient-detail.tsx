"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowLeft, Calendar, Phone, Mail, Home, User } from "lucide-react"
import { fetchPatientById, fetchLatestEncounters, fetchConditionsForPatient } from "@/lib/fhir-service"
import EncounterList from "./encounter-list"
import ConditionList from "./condition-list"

export default function PatientDetail({ patientId, onBack }) {
  const [patient, setPatient] = useState(null)
  const [encounters, setEncounters] = useState([])
  const [conditions, setConditions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch patient details
        const patientData = await fetchPatientById(patientId)
        setPatient(patientData)

        // Fetch encounters
        const encounterData = await fetchLatestEncounters(patientId)
        setEncounters(encounterData)

        // Fetch conditions
        const conditionData = await fetchConditionsForPatient(patientId)
        setConditions(conditionData)
      } catch (err) {
        setError(err.message || "Failed to load patient data")
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadPatientData()
    }
  }, [patientId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!patient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>The requested patient could not be found.</AlertDescription>
          </Alert>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </CardContent>
      </Card>
    )
  }

  const patientName = patient.name?.[0] || {}
  const fullName = [patientName.prefix?.join(" "), patientName.given?.join(" "), patientName.family]
    .filter(Boolean)
    .join(" ")

  const hasNoRecords = encounters.length === 0 && conditions.length === 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{fullName}</CardTitle>
            <CardDescription>
              Patient ID: {patient.id}
              {patient.gender && (
                <span className="ml-2">• {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>
              )}
              {patient.birthDate && (
                <span className="ml-2">• Born {new Date(patient.birthDate).toLocaleDateString()}</span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <User className="mr-2 h-4 w-4" />
              Demographics
            </h3>
            <div className="space-y-2">
              {patient.identifier?.length > 0 && (
                <div>
                  <span className="font-medium">Identifiers: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.identifier.map((id, index) => (
                      <Badge key={index} variant="outline">
                        {id.system ? `${id.system}: ` : ""}
                        {id.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {patient.telecom?.length > 0 && (
                <div className="space-y-1">
                  {patient.telecom.map((contact, index) => (
                    <div key={index} className="flex items-center">
                      {contact.system === "phone" && <Phone className="mr-2 h-4 w-4" />}
                      {contact.system === "email" && <Mail className="mr-2 h-4 w-4" />}
                      <span>{contact.value}</span>
                      {contact.use && <Badge className="ml-2">{contact.use}</Badge>}
                    </div>
                  ))}
                </div>
              )}

              {patient.address?.length > 0 && (
                <div className="space-y-1">
                  {patient.address.map((addr, index) => (
                    <div key={index} className="flex items-start">
                      <Home className="mr-2 h-4 w-4 mt-1" />
                      <div>
                        {addr.line?.join(", ")}
                        {addr.line?.length ? ", " : ""}
                        {addr.city}
                        {addr.city ? ", " : ""}
                        {addr.state}
                        {addr.state && addr.postalCode ? " " : ""}
                        {addr.postalCode}
                        {(addr.city || addr.state || addr.postalCode) && addr.country ? ", " : ""}
                        {addr.country}
                        {addr.use && <Badge className="ml-2">{addr.use}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Summary
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Active Conditions: </span>
                <span>{conditions.filter((c) => c.clinicalStatus?.coding?.[0]?.code === "active").length}</span>
              </div>
              <div>
                <span className="font-medium">Recent Encounters: </span>
                <span>{encounters.length}</span>
              </div>
              <div>
                <span className="font-medium">Last Updated: </span>
                <span>
                  {patient.meta?.lastUpdated ? new Date(patient.meta.lastUpdated).toLocaleString() : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasNoRecords ? (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>No Records</AlertTitle>
            <AlertDescription>Patient has no existing records. No encounters or conditions found.</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="encounters">
            <TabsList className="mb-4">
              <TabsTrigger value="encounters">Encounters ({encounters.length})</TabsTrigger>
              <TabsTrigger value="conditions">Conditions ({conditions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="encounters">
              <EncounterList encounters={encounters} patientId={patientId} />
            </TabsContent>

            <TabsContent value="conditions">
              <ConditionList conditions={conditions} patientId={patientId} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

