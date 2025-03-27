"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchPatients } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import AgeDistribution from "./age-distribution"
import ConditionStatistics from "./condition-statistics"

export default function PatientDashboard() {
  const { serverUrl } = useServer()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPatients(serverUrl)
      // Extract the patients array from the response
      console.log("patient array: ", data)
      setPatients(data.patients || [])
    } catch (err) {
      setError(err.message || "Failed to load patient data")
    } finally {
      setLoading(false)
    }
  }

  // Refetch when serverUrl changes
  useEffect(() => {
    loadPatients()
  }, [serverUrl])

  // Process data for gender distribution chart
  const processGenderData = () => {
    const genderCounts = {
      male: 0,
      female: 0,
      unknown: 0,
      undefined: 0,
    }

    if (!Array.isArray(patients)) {
      console.error("Expected patients to be an array, got:", patients)
      return Object.entries(genderCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    }

    patients.forEach((patient) => {
      const gender = patient.gender?.toLowerCase()
      if (gender in genderCounts) {
        genderCounts[gender]++
      } else {
        genderCounts.undefined++
      }
    })

    return Object.entries(genderCounts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .filter((item) => item.value > 0)
  }

  const genderData = processGenderData()

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"]

  // Calculate total patients by gender
  const totalPatients = patients.length
  const maleCount = patients.filter((p) => p.gender?.toLowerCase() === "male").length
  const femaleCount = patients.filter((p) => p.gender?.toLowerCase() === "female").length
  const unknownCount = patients.filter((p) => p.gender?.toLowerCase() === "unknown").length
  const undefinedCount = patients.filter((p) => !p.gender).length

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics Dashboard</CardTitle>
            <CardDescription>Loading patient data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-[300px] w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Demographics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadPatients} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patient Demographics Dashboard</CardTitle>
              <CardDescription>Overview of patient gender distribution</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={loadPatients} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">Gender Distribution</h3>
              <ChartContainer
                config={{
                  male: {
                    label: "Male",
                    color: COLORS[0],
                  },
                  female: {
                    label: "Female",
                    color: COLORS[1],
                  },
                  other: {
                    label: "Unknown",
                    color: COLORS[2],
                  },
                  unknown: {
                    label: "Undefined",
                    color: COLORS[3],
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-semibold mb-4">Patient Statistics</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm font-medium">Total Patients</div>
                  <div className="text-2xl font-bold">{totalPatients}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS[0]}20` }}>
                    <div className="text-sm font-medium">Male</div>
                    <div className="text-2xl font-bold">{maleCount}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalPatients > 0 ? `${((maleCount / totalPatients) * 100).toFixed(1)}%` : "0%"}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS[1]}20` }}>
                    <div className="text-sm font-medium">Female</div>
                    <div className="text-2xl font-bold">{femaleCount}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalPatients > 0 ? `${((femaleCount / totalPatients) * 100).toFixed(1)}%` : "0%"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS[2]}20` }}>
                    <div className="text-sm font-medium">Unknown</div>
                    <div className="text-2xl font-bold">{unknownCount}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalPatients > 0 ? `${((unknownCount / totalPatients) * 100).toFixed(1)}%` : "0%"}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS[3]}20` }}>
                    <div className="text-sm font-medium">Undefined</div>
                    <div className="text-2xl font-bold">{undefinedCount}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalPatients > 0 ? `${((undefinedCount / totalPatients) * 100).toFixed(1)}%` : "0%"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionStatistics />

      <AgeDistribution patients={patients} />
    </div>
  )
}

