"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RefreshCw, Eye } from "lucide-react"
import { fetchPatients } from "@/lib/fhir-service"

export default function PatientList({ initialPatients = null, onPatientSelect = null, hideSearch = false }) {
  const [patients, setPatients] = useState(initialPatients || [])
  const [loading, setLoading] = useState(!initialPatients)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const loadPatients = async () => {
    if (initialPatients) {
      setPatients(initialPatients)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchPatients()
      setPatients(data)
    } catch (err) {
      setError(err.message || "Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialPatients) {
      loadPatients()
    }
  }, [initialPatients])

  useEffect(() => {
    if (initialPatients) {
      setPatients(initialPatients)
    }
  }, [initialPatients])

  const filteredPatients = patients.filter((patient) => {
    const name = `${patient.name?.[0]?.given?.join(" ") || ""} ${patient.name?.[0]?.family || ""}`.toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Patient List</span>
          {!initialPatients && (
            <Button variant="outline" size="icon" onClick={loadPatients} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </CardTitle>
        {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : loading ? (
          <div className="text-center py-4">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-4">No patients found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Birth Date</TableHead>
                {onPatientSelect && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.id}</TableCell>
                  <TableCell>
                    {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
                  </TableCell>
                  <TableCell>{patient.gender || "Unknown"}</TableCell>
                  <TableCell>{patient.birthDate || "Unknown"}</TableCell>
                  {onPatientSelect && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPatientSelect(patient.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

