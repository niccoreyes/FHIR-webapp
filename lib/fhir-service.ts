export async function fetchPatients(serverUrl, pageSize = 100, pageNumber = 1) {
  try {
    console.log(`Fetching patients from ${serverUrl}...`)
    // Calculate offset based on page number and size
    const offset = (pageNumber - 1) * pageSize

    // Use _sort=-_lastUpdated to get the most recently updated patients first
    // Use _count to limit results per page
    // Use _getpagesoffset for pagination
    const response = await fetch(
      `${serverUrl}/Patient?_sort=-_lastUpdated&_count=${pageSize}&_getpagesoffset=${offset}`,
      {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Return both the patient resources and pagination info
    return {
      patients: data.entry?.map((entry) => entry.resource) || [],
      total: data.total || 0,
      links: data.link || [],
      pageSize,
      pageNumber,
      totalPages: Math.ceil((data.total || 0) / pageSize),
    }
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
 * Search for patients using various search parameters with pagination
 */
export async function searchPatients(searchParams, serverUrl, pageSize = 100, pageNumber = 1) {
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

    // Calculate offset based on page number and size
    const offset = (pageNumber - 1) * pageSize

    // Add pagination parameters
    queryParams.append("_count", pageSize.toString())
    queryParams.append("_getpagesoffset", offset.toString())

    // Add _sort parameter to sort by last updated date (newest first)
    queryParams.append("_sort", "-_lastUpdated")

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
      links: data.link || [],
      pageSize,
      pageNumber,
      totalPages: Math.ceil((data.total || 0) / pageSize),
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
 * Fetches all conditions from the FHIR server
 */
export async function fetchAllConditions(serverUrl, limit = 100) {
  try {
    console.log(`Fetching all conditions from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Condition?_count=${limit}`, {
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
    console.error("Error fetching conditions:", error)
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

