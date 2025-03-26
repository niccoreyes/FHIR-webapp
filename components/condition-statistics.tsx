"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchAllConditions } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ConditionStatistics() {
  const { serverUrl } = useServer()
  const [conditions, setConditions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadConditions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllConditions(serverUrl)
      setConditions(data)
    } catch (err) {
      setError(err.message || "Failed to load condition data")
    } finally {
      setLoading(false)
    }
  }

  // Refetch when serverUrl changes
  useEffect(() => {
    loadConditions()
  }, [serverUrl])

  // Process data for condition distribution chart
  const processConditionData = () => {
    // Count conditions by code
    const conditionCounts = {}

    conditions.forEach((condition) => {
      const code = condition.code?.coding?.[0]?.code || "unknown"
      const display = condition.code?.coding?.[0]?.display || condition.code?.text || "Unknown"

      const key = `${code}|${display}`

      if (conditionCounts[key]) {
        conditionCounts[key]++
      } else {
        conditionCounts[key] = 1
      }
    })

    // Convert to array and sort by count
    return Object.entries(conditionCounts)
      .map(([key, count]) => {
        const [code, display] = key.split("|")
        return {
          code,
          name: display,
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 conditions
  }

  // Process data for clinical status distribution
  const processClinicalStatusData = () => {
    const statusCounts = {
      active: 0,
      resolved: 0,
      remission: 0,
      recurrence: 0,
      inactive: 0,
      unknown: 0,
    }

    conditions.forEach((condition) => {
      const status = condition.clinicalStatus?.coding?.[0]?.code || "unknown"
      if (status in statusCounts) {
        statusCounts[status]++
      } else {
        statusCounts.unknown++
      }
    })

    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .filter((item) => item.value > 0)
  }

  const conditionData = processConditionData()
  const statusData = processClinicalStatusData()

  // Calculate statistics
  const totalConditions = conditions.length
  const activeConditions = conditions.filter((c) => c.clinicalStatus?.coding?.[0]?.code === "active").length
  const resolvedConditions = conditions.filter((c) => c.clinicalStatus?.coding?.[0]?.code === "resolved").length
  const uniqueConditionCodes = new Set(conditions.map((c) => c.code?.coding?.[0]?.code)).size

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Condition Statistics</CardTitle>
          <CardDescription>Loading condition data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Condition Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadConditions} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Condition Statistics</CardTitle>
            <CardDescription>Overview of patient conditions</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={loadConditions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium">Total Conditions</div>
              <div className="text-2xl font-bold">{totalConditions}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50">
                <div className="text-sm font-medium">Active</div>
                <div className="text-2xl font-bold">{activeConditions}</div>
                <div className="text-sm text-muted-foreground">
                  {totalConditions > 0 ? `${((activeConditions / totalConditions) * 100).toFixed(1)}%` : "0%"}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50">
                <div className="text-sm font-medium">Resolved</div>
                <div className="text-2xl font-bold">{resolvedConditions}</div>
                <div className="text-sm text-muted-foreground">
                  {totalConditions > 0 ? `${((resolvedConditions / totalConditions) * 100).toFixed(1)}%` : "0%"}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium">Unique Condition Types</div>
              <div className="text-2xl font-bold">{uniqueConditionCodes}</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Clinical Status Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {statusData.map((status) => (
                  <Badge
                    key={status.name}
                    className={`
                      ${status.name.toLowerCase() === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      ${status.name.toLowerCase() === "resolved" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}
                      ${status.name.toLowerCase() === "remission" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : ""}
                      ${status.name.toLowerCase() === "recurrence" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}
                      ${status.name.toLowerCase() === "inactive" ? "bg-gray-100 text-gray-800 hover:bg-gray-100" : ""}
                      ${status.name.toLowerCase() === "unknown" ? "bg-gray-100 text-gray-800 hover:bg-gray-100" : ""}
                    `}
                  >
                    {status.name}: {status.value}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Top Conditions</h3>
            {conditionData.length === 0 ? (
              <div className="text-center py-8">No condition data available</div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="count" name="Count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

