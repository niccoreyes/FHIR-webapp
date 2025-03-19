export async function fetchPatients(serverUrl) {
  try {
    console.log(`Fetching patients from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Patient?_count=100`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function createPatient(patientResource, serverUrl) {
  try {
    console.log(`Creating patient on ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Patient`, {
      method: "POST",
      headers: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
      body: JSON.stringify(patientResource),
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function fetchPatientById(id, serverUrl) {
  try {
    console.log(`Fetching patient ${id} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Patient/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function searchPatients(searchParams, serverUrl) {
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

    const url = `${serverUrl}/Patient?${queryParams.toString()}`
    console.log(`Searching patients with URL: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function fetchLatestEncounters(patientId, count = 5, serverUrl) {
  try {
    console.log(`Fetching encounters for patient ${patientId} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Encounter?patient=${patientId}&_sort=-date&_count=${count}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function fetchConditionsForEncounter(encounterId, serverUrl) {
  try {
    console.log(`Fetching conditions for encounter ${encounterId} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Condition?encounter=${encounterId}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
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
export async function fetchConditionsForPatient(patientId, serverUrl) {
  try {
    console.log(`Fetching conditions for patient ${patientId} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Condition?patient=${patientId}&_sort=-recorded-date`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching conditions for patient ${patientId}:`, error)
    throw error
  }
}

/**
 * Fetches a list of organizations from the FHIR server
 */
export async function fetchOrganizations(serverUrl) {
  try {
    console.log(`Fetching organizations from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Organization?_count=100`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry) => entry.resource) || []
  } catch (error) {
    console.error("Error fetching organizations:", error)
    throw error
  }
}

