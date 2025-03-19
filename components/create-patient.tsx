"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, InfoIcon } from "lucide-react"
import { createPatient, fetchOrganizations } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"

const formSchema = z.object({
  givenName: z.string().min(1, "First name is required"),
  familyName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other", "unknown"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  managingOrganization: z.string().min(1, "Managing organization is required"),
})

export default function CreatePatient({ onSuccess }) {
  const { serverUrl } = useServer()
  const [status, setStatus] = useState({ loading: false, success: false, error: null })
  const [organizations, setOrganizations] = useState([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoadingOrgs(true)
        const data = await fetchOrganizations(serverUrl)
        setOrganizations(data)
      } catch (error) {
        console.error("Failed to load organizations:", error)
      } finally {
        setLoadingOrgs(false)
      }
    }

    loadOrganizations()
  }, [serverUrl])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      givenName: "",
      familyName: "",
      gender: "unknown",
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      managingOrganization: "",
    },
  })

  const onSubmit = async (data) => {
    try {
      setStatus({ loading: true, success: false, error: null })

      const patientResource = {
        resourceType: "Patient",
        // Add meta.profile to declare conformance to the required profile
        meta: {
          profile: ["http://fhir.local/fhir/StructureDefinition/PatientProfile2"],
        },
        name: [
          {
            use: "official",
            family: data.familyName,
            given: [data.givenName], // Ensure given name is included (min=1)
          },
        ],
        gender: data.gender,
        birthDate: data.birthDate,
        telecom: [
          ...(data.phone ? [{ system: "phone", value: data.phone }] : []),
          ...(data.email ? [{ system: "email", value: data.email }] : []),
        ],
        address: data.address
          ? [
              {
                line: [data.address],
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
              },
            ]
          : [],
        // Include managing organization (min=1)
        managingOrganization: {
          reference: `Organization/${data.managingOrganization}`,
        },
      }

      await createPatient(patientResource, serverUrl)
      setStatus({ loading: false, success: true, error: null })
      form.reset()

      // Call onSuccess after a delay to show the success message
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        error: err.message || "Failed to create patient",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Patient</CardTitle>
        <CardDescription>Enter the patient details to create a new patient record in the FHIR server.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Profile information alert */}
        <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle>Profile Requirements</AlertTitle>
          <AlertDescription>
            <p>This form creates patients that conform to the PatientProfile2 profile, which requires:</p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              <li>At least one name with a given name (first name)</li>
              <li>A managing organization</li>
            </ul>
          </AlertDescription>
        </Alert>

        {status.success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Patient record created successfully!</AlertDescription>
          </Alert>
        )}

        {status.error && (
          <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Form fields remain the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="givenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      First Name*
                      <span className="ml-1 text-xs text-muted-foreground">(Required by profile)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="familyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Format: YYYY-MM-DD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Managing Organization field - required by profile */}
            <FormField
              control={form.control}
              name="managingOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Managing Organization*
                    <span className="ml-1 text-xs text-muted-foreground">(Required by profile)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingOrgs ? "Loading organizations..." : "Select an organization"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name || org.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The organization responsible for managing this patient</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="ml-auto" disabled={status.loading}>
                {status.loading ? "Creating..." : "Create Patient"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

