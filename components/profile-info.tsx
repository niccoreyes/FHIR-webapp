import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function ProfileInfo() {
  return (
    <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle>Profile Requirements</AlertTitle>
      <AlertDescription>
        <p>This form is configured to create patients that conform to the following profiles:</p>
        <ul className="list-disc pl-5 mt-2 text-sm">
          <li>http://fhir.local/fhir/StructureDefinition/MyPatientProfile</li>
          <li>http://fhir.local/fhir/StructureDefinition/PatientProfile2</li>
        </ul>
        <p className="mt-2 text-sm">
          These profiles require that patients have at least one name with a given name (first name) and a managing
          organization.
        </p>
      </AlertDescription>
    </Alert>
  )
}

