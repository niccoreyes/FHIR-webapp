"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, Server } from "lucide-react"
import { searchPatients } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"

const searchSchema = z.object({
  name: z.string().optional(),
  given: z.string().optional(),
  family: z.string().optional(),
  identifier: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unknown", ""]).optional(),
  birthdate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  pageSize: z.enum(["10", "25", "50", "100"]).default("25"),
})

export default function AdvancedSearch({ onSearchResults }) {
  const { serverUrl } = useServer()
  const [status, setStatus] = useState({ loading: false, error: null })

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      name: "",
      given: "",
      family: "",
      identifier: "",
      gender: "",
      birthdate: "",
      phone: "",
      email: "",
      address: "",
      pageSize: "25",
    },
  })

  const onSubmit = async (data) => {
    try {
      setStatus({ loading: true, error: null })

      // Extract page size and convert to number
      const pageSize = Number.parseInt(data.pageSize)

      // Filter out empty fields and the pageSize field
      const searchParams = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => value !== "" && key !== "pageSize"),
      )

      // Check if at least one search parameter is provided
      if (Object.keys(searchParams).length === 0) {
        setStatus({ loading: false, error: "Please provide at least one search parameter" })
        return
      }

      // If name is provided, use it for a more general search
      // FHIR servers typically search across name parts when using the 'name' parameter
      if (searchParams.given || searchParams.family) {
        // If both given and family are provided, also add a general name search
        // that combines them to catch partial matches across name segments
        if (searchParams.given && searchParams.family) {
          searchParams.name = `${searchParams.given} ${searchParams.family}`
        }
      }

      console.log(`Searching patients on server: ${serverUrl}`)
      const results = await searchPatients(searchParams, serverUrl, pageSize, 1)

      // Include the search parameters in the results for pagination
      results.searchParams = searchParams

      onSearchResults(results)
      setStatus({ loading: false, error: null })
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Failed to search patients",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Patient Search</CardTitle>
        <CardDescription>Search for patients using various criteria. At least one field is required.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Display current server information */}
        <div className="mb-4 p-2 bg-muted rounded-md flex items-center">
          <Server className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">
            Searching on: <span className="font-medium">{serverUrl}</span>
          </span>
        </div>

        {status.error && (
          <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="given"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="family"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID</FormLabel>
                    <FormControl>
                      <Input placeholder="000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Results Per Page</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="25" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="ml-auto" disabled={status.loading}>
                {status.loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Patients
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

