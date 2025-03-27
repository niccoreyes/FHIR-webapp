export async function fetchPatientCount(serverUrl: string): Promise<number> {
  try {
    console.log(`Fetching patient count from ${serverUrl}...`)
    // Use _summary=count to only get the count, not the actual resources
    const response = await fetch(`${serverUrl}/Patient?_summary=count`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Log the raw response to help debug
    console.log("Patient count response:", data)

    // Extract the total count
    const total: number = typeof data.total === "number" ? data.total : 0
    console.log(`Total patients on server (from count endpoint): ${total}`)

    return total
  } catch (error) {
    console.error("Error fetching patient count:", error)
    // Return -1 to indicate an error occurred
    return -1
  }
}

/**
 * Fetches a list of patients from the FHIR server with pagination
 * Returns patients sorted by last updated date (newest first)
 */
export async function fetchPatients(
  serverUrl: string,
  pageSize: number,
  pageNumber: number = 1,
  sortParam: string = "-_lastUpdated"
): Promise<{ patients: any[]; total: number; links: any[]; pageSize: number; pageNumber: number; totalPages: number }> {
  try {
    console.log(`Fetching patients from ${serverUrl}...`)

    let response;
    if (!pageSize) {
      pageSize = await fetchPatientCount(serverUrl);
      console.log(`No pageSize provided. Using total count: ${pageSize}`);
    }
    const offset = (pageNumber - 1) * pageSize;
    response = await fetch(
      `${serverUrl}/Patient?_sort=${sortParam}&_count=${pageSize}&_getpagesoffset=${offset}&_total=accurate`,
      {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Log the raw response to help debug
    console.log("Patient response data:", {
      total: data.total,
      entryCount: data.entry?.length || 0,
      link: data.link,
    })

    // Return both the patient resources and pagination info
    const patients = data.entry?.map((entry: any) => entry.resource) || []

    // Try to get the total from the response
    let total: number = typeof data.total === "number" ? data.total : 0

    // If total is 0 but we have patients, something is wrong with the server's total count
    if (total === 0 && patients.length > 0) {
      console.warn("Server returned 0 total but has patients. Attempting to fetch accurate count...")
      // Try to get a more accurate count
      const accurateTotal = await fetchPatientCount(serverUrl)
      if (accurateTotal > 0) {
        total = accurateTotal
      } else {
        // Fallback: estimate based on current page and patients returned
        total = (pageNumber - 1) * pageSize + patients.length
        if (patients.length === pageSize) {
          // If we got a full page, there might be more
          total += 1 // Add 1 to indicate there are more (we'll adjust this later)
        }
        console.warn(`Using estimated total: ${total}`)
      }
    }

    // Calculate total pages based on the total count and page size
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    console.log(`Server returned: ${patients.length} patients`)
    console.log(`Total patients on server: ${total}`)
    console.log(`Total pages calculated: ${totalPages}`)

    return {
      patients,
      total,
      links: data.link || [],
      pageSize,
      pageNumber,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching patients:", error)
    throw error
  }
}

/**
 * Creates a new patient in the FHIR server
 */
export async function createPatient(patientResource: any, serverUrl: string): Promise<any> {
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
export async function fetchPatientById(id: string, serverUrl: string): Promise<any> {
  try {
    console.log(`Fetching patient ${id} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Patient/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Patient with ID ${id} not found on server ${serverUrl}`)
      }
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
export async function searchPatients(
  searchParams: any,
  serverUrl: string,
  pageSize: number = 100,
  pageNumber: number = 1,
  sortParam: string = "-_lastUpdated"
): Promise<{ patients: any[]; total: number; links: any[]; pageSize: number; pageNumber: number; totalPages: number; searchParams: any }> {
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

    // Add _sort parameter for sorting
    queryParams.append("_sort", sortParam)

    // Add _total=accurate to request an accurate count
    queryParams.append("_total", "accurate")

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

    // Log the raw response to help debug
    console.log("Search response data:", {
      total: data.total,
      entryCount: data.entry?.length || 0,
      link: data.link,
    })

    const patients = data.entry?.map((entry: any) => entry.resource) || []

    // Try to get the total from the response
    let total: number = typeof data.total === "number" ? data.total : 0

    // If total is 0 but we have patients, something is wrong with the server's total count
    if (total === 0 && patients.length > 0) {
      console.warn("Server returned 0 total but has patients. Using fallback count estimation.")
      // Fallback: estimate based on current page and patients returned
      total = (pageNumber - 1) * pageSize + patients.length
      if (patients.length === pageSize) {
        // If we got a full page, there might be more
        total += 1 // Add 1 to indicate there are more (we'll adjust this later)
      }
      console.warn(`Using estimated total: ${total}`)
    }

    // Calculate total pages based on the total count and page size
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    console.log(`Server returned: ${patients.length} search results`)
    console.log(`Total matching patients on server: ${total}`)
    console.log(`Total pages calculated: ${totalPages}`)

    return {
      patients,
      total,
      links: data.link || [],
      pageSize,
      pageNumber,
      totalPages,
      searchParams,
    }
  } catch (error) {
    console.error("Error searching patients:", error)
    throw error
  }
}

/**
 * Fetches the latest encounters for a patient
 */
export async function fetchLatestEncounters(patientId: string, count: number = 5, serverUrl: string): Promise<any[]> {
  try {
    console.log(`Fetching encounters for patient ${patientId} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Encounter?patient=${patientId}&_sort=-date&_count=${count}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No encounters found for patient ${patientId} on server ${serverUrl}`)
        return []
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry: any) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching encounters for patient ${patientId}:`, error)
    // Return empty array instead of throwing for non-critical errors
    return []
  }
}

/**
 * Fetches conditions associated with an encounter
 */
export async function fetchConditionsForEncounter(encounterId: string, serverUrl: string): Promise<any[]> {
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
    return data.entry?.map((entry: any) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching conditions for encounter ${encounterId}:`, error)
    throw error
  }
}

/**
 * Fetches conditions for a patient
 */
export async function fetchConditionsForPatient(patientId: string, serverUrl: string): Promise<any[]> {
  try {
    console.log(`Fetching conditions for patient ${patientId} from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Condition?patient=${patientId}&_sort=-recorded-date`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No conditions found for patient ${patientId} on server ${serverUrl}`)
        return []
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry: any) => entry.resource) || []
  } catch (error) {
    console.error(`Error fetching conditions for patient ${patientId}:`, error)
    // Return empty array instead of throwing for non-critical errors
    return []
  }
}

/**
 * Fetches all conditions from the FHIR server.
 * If limit is not provided, fetch the total count and use it as the limit.
 */
export async function fetchAllConditions(serverUrl: string, limit?: number): Promise<any[]> {
  try {
    console.log(`Fetching all conditions from ${serverUrl}...`)
    if (limit === undefined) {
      const countResponse = await fetch(`${serverUrl}/Condition?_summary=count`, {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
        },
      });
      if (!countResponse.ok) {
        throw new Error(`HTTP error ${countResponse.status}: ${countResponse.statusText}`);
      }
      const countData = await countResponse.json();
      limit = typeof countData.total === "number" ? countData.total : 0;
      console.log(`No limit provided. Using total count: ${limit}`);
    }
    const response = await fetch(`${serverUrl}/Condition?_count=${limit}`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry: any) => entry.resource) || []
  } catch (error) {
    console.error("Error fetching conditions:", error)
    throw error
  }
}

/**
 * Fetches a list of organizations from the FHIR server
 */
export async function fetchOrganizations(serverUrl: string): Promise<any[]> {
  try {
    console.log(`Fetching organizations from ${serverUrl}...`)
    const response = await fetch(`${serverUrl}/Organization`, {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.entry?.map((entry: any) => entry.resource) || []
  } catch (error) {
    console.error("Error fetching organizations:", error)
    throw error
  }
}
