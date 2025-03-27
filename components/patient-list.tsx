"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Search,
  RefreshCw,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Server,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react"
import { fetchPatients, searchPatients, fetchPatientCount } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define sort field types
type SortField = "name" | "gender" | "birthDate" | "lastUpdated" | "id"
type SortDirection = "asc" | "desc"

export default function PatientList({
  initialPatients = null,
  onPatientSelect = null,
  hideSearch = false,
  paginationData = null,
}) {
  const { serverUrl } = useServer()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(!initialPatients)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingCount, setLoadingCount] = useState(false)

  // Pagination state
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [searchParams, setSearchParams] = useState(null)
  const [countVerified, setCountVerified] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("lastUpdated")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [jumpToPage, setJumpToPage] = useState("")

  // Initialize from paginationData if provided (for search results)
  useEffect(() => {
    if (paginationData) {
      setTotalPatients(paginationData.total || 0)
      setTotalPages(paginationData.totalPages || 1)
      setPageSize(paginationData.pageSize || 25)
      setCurrentPage(paginationData.pageNumber || 1)
      if (paginationData.searchParams) {
        setSearchParams(paginationData.searchParams)
      }
    }
  }, [paginationData])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }

    // Reset to first page when sorting changes
    if (!initialPatients) {
      loadPatients(1, pageSize, field, sortDirection === "asc" ? "desc" : "asc")
    }
  }

  // Get sort parameter for FHIR API
  const getSortParam = (field: SortField, direction: SortDirection): string => {
    // Map our sort fields to FHIR sort parameters
    const fieldMap = {
      name: "family",
      gender: "gender",
      birthDate: "birthdate",
      lastUpdated: "_lastUpdated",
      id: "_id",
    }

    const prefix = direction === "desc" ? "-" : ""
    return `${prefix}${fieldMap[field]}`
  }

  // Verify the total count if it seems suspicious (0 but we have patients)
  const verifyTotalCount = async () => {
    if (countVerified || totalPatients > 0) return

    try {
      setLoadingCount(true)
      console.log("Verifying total patient count...")
      const count = await fetchPatientCount(serverUrl)

      if (count > 0) {
        console.log(`Verified count: ${count}`)
        setTotalPatients(count)
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)))
        setCountVerified(true)
      } else if (count === 0 && patients.length > 0) {
        // If we still get 0 but have patients, use the length as a minimum
        const estimatedTotal = Math.max(patients.length, (currentPage - 1) * pageSize + patients.length)
        console.log(`Using estimated count: ${estimatedTotal}`)
        setTotalPatients(estimatedTotal)
        setTotalPages(Math.max(1, Math.ceil(estimatedTotal / pageSize)))
        setCountVerified(true)
      }
    } catch (err) {
      console.error("Error verifying count:", err)
    } finally {
      setLoadingCount(false)
    }
  }

  const loadPatients = async (page = currentPage, size = pageSize, field = sortField, direction = sortDirection) => {
    if (initialPatients) {
      setPatients(initialPatients)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCountVerified(false)

      const sortParam = getSortParam(field, direction)
      console.log(`Loading patients from server: ${serverUrl}, page: ${page}, size: ${size}, sort: ${sortParam}`)
      const result = await fetchPatients(serverUrl, size, page, sortParam)

      // Add debugging logs
      console.log(`Server returned: ${result.patients.length} patients`)
      console.log(`Total patients on server: ${result.total}`)
      console.log(`Total pages calculated: ${result.totalPages}`)

      setPatients(result.patients)
      setTotalPatients(result.total)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPageSize(size)

      // If we got patients but total is 0, something is wrong
      if (result.patients.length > 0 && result.total === 0) {
        console.warn("Server returned patients but total is 0. Will verify count.")
        // We'll verify the count after rendering
      } else {
        setCountVerified(true)
      }
    } catch (err) {
      setError(err.message || "Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  // Similarly, update loadSearchPage:
  const loadSearchPage = async (page = currentPage, size = pageSize, field = sortField, direction = sortDirection) => {
    if (!searchParams) return

    try {
      setLoading(true)
      setError(null)
      setCountVerified(false)

      const sortParam = getSortParam(field, direction)
      console.log(`Loading search results from server: ${serverUrl}, page: ${page}, size: ${size}, sort: ${sortParam}`)
      const result = await searchPatients(searchParams, serverUrl, size, page, sortParam)

      // Add debugging logs
      console.log(`Server returned: ${result.patients.length} search results`)
      console.log(`Total matching patients on server: ${result.total}`)
      console.log(`Total pages calculated: ${result.totalPages}`)

      setPatients(result.patients)
      setTotalPatients(result.total)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPageSize(size)

      // If we got patients but total is 0, something is wrong
      if (result.patients.length > 0 && result.total === 0) {
        console.warn("Server returned patients but total is 0. Will verify count.")
        // We'll verify the count after rendering
      } else {
        setCountVerified(true)
      }
    } catch (err) {
      setError(err.message || "Failed to load search results")
    } finally {
      setLoading(false)
    }
  }

  // Refetch when serverUrl changes
  useEffect(() => {
    if (!initialPatients) {
      // Reset to first page when server changes
      loadPatients(1, pageSize, sortField, sortDirection)
    }
  }, [initialPatients, serverUrl])

  useEffect(() => {
    if (initialPatients) {
      setPatients(initialPatients)

      // If paginationData is provided, use its total count
      if (paginationData) {
        setTotalPatients(paginationData.total || 0)
        setTotalPages(paginationData.totalPages || 1)
      } else {
        // If no paginationData, use the length of initialPatients as a fallback
        // Note: This is only accurate if initialPatients contains ALL patients
        setTotalPatients(initialPatients.length)
        setTotalPages(Math.ceil(initialPatients.length / pageSize))
      }
    }
  }, [initialPatients, paginationData, pageSize])

  // Verify total count if needed
  useEffect(() => {
    // If we have patients but total is 0, verify the count
    if (!loading && !countVerified && patients.length > 0 && totalPatients === 0) {
      verifyTotalCount()
    }
  }, [loading, countVerified, patients, totalPatients])

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    const size = Number.parseInt(newSize)

    // Calculate the first record index of the current page
    const firstRecordIndex = (currentPage - 1) * pageSize + 1

    // Calculate which page this record would be on with the new page size
    const newPage = Math.max(1, Math.ceil(firstRecordIndex / size))

    setPageSize(size)

    if (paginationData && searchParams) {
      loadSearchPage(newPage, size, sortField, sortDirection)
    } else {
      loadPatients(newPage, size, sortField, sortDirection)
    }
  }

  // Handle page navigation
  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    if (paginationData && searchParams) {
      loadSearchPage(page, pageSize, sortField, sortDirection)
    } else {
      loadPatients(page, pageSize, sortField, sortDirection)
    }
  }

  // Handle jump to page
  const handleJumpToPage = () => {
    const page = Number.parseInt(jumpToPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page)
      setJumpToPage("")
    }
  }

  // Format patient name to include first, middle, and last name
  const formatPatientName = (patient) => {
    const name = patient.name?.[0]
    if (!name) return "Unknown"

    let firstName = ""
    let middleName = ""

    if (name.given && name.given.length > 0) {
      firstName = name.given[0]

      // If there's a second given name, it's the middle name
      if (name.given.length > 1) {
        middleName = name.given[1]
      }
    }

    return [firstName, middleName, name.family].filter(Boolean).join(" ")
  }

  const filteredPatients = useMemo(() => {
    if (!patients || !Array.isArray(patients)) return []

    return patients.filter((patient) => {
      if (!searchTerm) return true

      const searchTermLower = searchTerm.toLowerCase()
      const name = patient.name?.[0]

      if (!name) return false

      // Check family name (last name)
      const familyName = name.family?.toLowerCase() || ""
      if (familyName.includes(searchTermLower)) return true

      // Check all given names (first and middle names)
      if (name.given && name.given.length > 0) {
        // Check each given name individually
        for (const givenName of name.given) {
          if (givenName.toLowerCase().includes(searchTermLower)) return true
        }

        // Also check the combined given names
        const allGivenNames = name.given.join(" ").toLowerCase()
        if (allGivenNames.includes(searchTermLower)) return true
      }

      // Check the full name as a fallback
      const fullName = formatPatientName(patient).toLowerCase()
      return fullName.includes(searchTermLower)
    })
  }, [patients, searchTerm])

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show a window of pages around the current page
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  // Render sort icon based on current sort state
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
    }

    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
  }

  // Determine if we should show patients
  const shouldShowPatients = !loading && filteredPatients.length > 0

  // Determine if we should show "No patients found" message
  const shouldShowNoPatients = !loading && filteredPatients.length === 0 && !loadingCount

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>{initialPatients ? "Search Results" : "Patient List"}</CardTitle>
            {/* Display current server information */}
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Server className="h-3 w-3 mr-1" />
              <span>Server: {serverUrl}</span>
              {totalPatients > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {totalPatients} total patients
                </span>
              )}
              {loadingCount && (
                <span className="ml-2 text-xs text-muted-foreground italic flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Verifying count...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Show:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!initialPatients && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadPatients(currentPage, pageSize, sortField, sortDirection)}
                disabled={loading || loadingCount}
              >
                <RefreshCw className={`h-4 w-4 ${loading || loadingCount ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {!hideSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-red-500">
            {error}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  paginationData && searchParams
                    ? loadSearchPage(currentPage, pageSize, sortField, sortDirection)
                    : loadPatients(currentPage, pageSize, sortField, sortDirection)
                }
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-4">Loading patients...</div>
        ) : patients.length > 0 && totalPatients === 0 && !countVerified ? (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700">Verifying patient count data from server...</AlertDescription>
          </Alert>
        ) : shouldShowNoPatients ? (
          <div className="text-center py-4">No patients found</div>
        ) : shouldShowPatients ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("id")}>
                    <div className="flex items-center">ID {renderSortIcon("id")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                    <div className="flex items-center">Name {renderSortIcon("name")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("gender")}>
                    <div className="flex items-center">Gender {renderSortIcon("gender")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("birthDate")}>
                    <div className="flex items-center">Birth Date {renderSortIcon("birthDate")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("lastUpdated")}>
                    <div className="flex items-center">Last Updated{renderSortIcon("lastUpdated")}</div>
                  </TableHead>
                  {onPatientSelect && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.id}</TableCell>
                    <TableCell>{formatPatientName(patient)}</TableCell>
                    <TableCell>{patient.gender || "Unknown"}</TableCell>
                    <TableCell>{patient.birthDate || "Unknown"}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>
                                {patient.meta?.lastUpdated
                                  ? new Date(patient.meta.lastUpdated).toLocaleDateString()
                                  : "Unknown"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {patient.meta?.lastUpdated
                              ? new Date(patient.meta.lastUpdated).toLocaleString()
                              : "Unknown date"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {onPatientSelect && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPatientSelect(patient.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>

      {!loading && (
        <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {totalPatients > 0 ? (
              <>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalPatients)}-
                {Math.min(currentPage * pageSize, totalPatients)} of {totalPatients} patients
              </>
            ) : patients.length > 0 ? (
              <>
                Showing {patients.length} patients
                {loadingCount && " (verifying total count...)"}
              </>
            ) : (
              "No patients to display"
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="hidden md:flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Jump to page popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Page {currentPage} of {totalPages}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-0" align="center">
                  <div className="p-4 flex flex-col gap-2">
                    <div className="text-sm text-center text-muted-foreground">Jump to page (1-{totalPages})</div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        max={totalPages}
                        placeholder="Page #"
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleJumpToPage()
                          }
                        }}
                        className="w-24"
                      />
                      <Button size="sm" onClick={handleJumpToPage}>
                        Go
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

