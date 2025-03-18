const FHIR_SERVER_URL = "https://cdr.fhirlab.net/fhir"

/**
 * Fetches a list of patients from the FHIR server
 */
export async function fetchPatients() {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Patient?_count=100`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch patients: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error("Error fetching patients:", error)
    throw error
  }
}

/**
 * Creates a new patient in the FHIR server
 */
export async function createPatient(patientResource) {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Patient`, {
      method: "POST",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
      body: JSON.stringify(patientResource),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create patient: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating patient:", error)
    throw error
  }
}

/**
 * Fetches a specific patient by ID
 */
export async function fetchPatientById(id) {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Patient/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch patient: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching patient ${id}:`, error)
    throw error
  }
}

/**
 * Search for patients using various search parameters
 */
export async function searchPatients(searchParams) {
  try {
    // Construct query string from search parameters
    const queryParams = new URLSearchParams()

    if (searchParams.name) queryParams.append("name", searchParams.name)
    if (searchParams.given) queryParams.append("given", searchParams.given)
    if (searchParams.family) queryParams.append("family", searchParams.family)
    if (searchParams.identifier) queryParams.append("identifier", searchParams.identifier)
    if (searchParams.gender) queryParams.append("gender", searchParams.gender)
    if (searchParams.birthdate) queryParams.append("birthdate", searchParams.birthdate)
    if (searchParams.phone) queryParams.append("phone", searchParams.phone)
    if (searchParams.email) queryParams.append("email", searchParams.email)
    if (searchParams.address) queryParams.append("address", searchParams.address)

    // Add _count parameter to limit results
    queryParams.append("_count", "20")

    const url = `${FHIR_SERVER_URL}/Patient?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to search patients: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return {
      total: data.total || 0,
      patients: data.entry?.map((entry) => entry.resource) || [],
    }
  } catch (error) {
    console.error("Error searching patients:", error)
    throw error
  }
}

/**
 * Fetches the latest encounters for a patient
 */
export async function fetchLatestEncounters(patientId, count = 5) {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Encounter?patient=${patientId}&_sort=-date&_count=${count}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch encounters: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching encounters for patient ${patientId}:`, error)
    throw error
  }
}

/**
 * Fetches conditions associated with an encounter
 */
export async function fetchConditionsForEncounter(encounterId) {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Condition?encounter=${encounterId}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch conditions: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching conditions for encounter ${encounterId}:`, error)
    throw error
  }
}

/**
 * Fetches conditions for a patient
 */
export async function fetchConditionsForPatient(patientId) {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/Condition?patient=${patientId}&_sort=-recorded-date`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch conditions: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching conditions for patient ${patientId}:`, error)
    throw error
  }
}

