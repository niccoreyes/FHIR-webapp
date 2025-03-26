"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AgeDistribution({ patients }) {
  // Process data for age distribution chart
  const processAgeData = () => {
    const ageGroups = {
      "0-17": 0,
      "18-34": 0,
      "35-50": 0,
      "51-65": 0,
      "66+": 0,
      Unknown: 0,
    }

    // Ensure patients is an array before using forEach
    if (!Array.isArray(patients)) {
      console.error("Expected patients to be an array, got:", patients)
      return Object.entries(ageGroups).map(([name, value]) => ({
        name,
        value,
      }))
    }

    patients.forEach((patient) => {
      if (!patient.birthDate) {
        ageGroups["Unknown"]++
        return
      }

      const birthDate = new Date(patient.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) ageGroups["0-17"]++
      else if (age < 35) ageGroups["18-34"]++
      else if (age < 51) ageGroups["35-50"]++
      else if (age < 66) ageGroups["51-65"]++
      else ageGroups["66+"]++
    })

    return Object.entries(ageGroups).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const ageData = processAgeData()

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Age Distribution</CardTitle>
        <CardDescription>Patient age groups distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Patients",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="value" name="Patients" fill="var(--color-value)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

