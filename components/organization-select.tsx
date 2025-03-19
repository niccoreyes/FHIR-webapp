"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { fetchOrganizations } from "@/lib/fhir-service"

export default function OrganizationSelect({ form }) {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        const data = await fetchOrganizations()
        setOrganizations(data)
      } catch (err) {
        setError(err.message || "Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [])

  const filteredOrganizations = organizations.filter((org) =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <FormField
      control={form.control}
      name="orgID"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center">
            Managing Organization*
            <span className="ml-1 text-xs text-muted-foreground">(Required by profile)</span>
          </FormLabel>
          <FormControl>
            {loading ? (
              <Input placeholder="Loading organizations..." disabled />
            ) : organizations.length > 0 ? (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredOrganizations.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">No organizations found</div>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder="Enter organization ID" {...field} />
            )}
          </FormControl>
          <FormDescription>
            {error ? (
              <span className="text-red-500 text-xs">{error}</span>
            ) : (
              "The organization responsible for managing this patient"
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

