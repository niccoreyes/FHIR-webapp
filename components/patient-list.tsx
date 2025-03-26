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
} from "lucide-react"
import { fetchPatients, searchPatients } from "@/lib/fhir-service"
import { useServer } from "@/contexts/server-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  // Pagination state
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [searchParams, setSearchParams] = useState(null)

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

  const loadPatients = async (page = currentPage, size = pageSize) => {
    if (initialPatients) {
      setPatients(initialPatients)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log(`Loading patients from server: ${serverUrl}, page: ${page}, size: ${size}`)
      const result = await fetchPatients(serverUrl, size, page)

      setPatients(result.patients)
      setTotalPatients(result.total)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPageSize(size)
    } catch (err) {
      setError(err.message || "Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  // Load search results for a different page
  const loadSearchPage = async (page = currentPage, size = pageSize) => {
    if (!searchParams) return

    try {
      setLoading(true)
      setError(null)

      console.log(`Loading search results from server: ${serverUrl}, page: ${page}, size: ${size}`)
      const result = await searchPatients(searchParams, serverUrl, size, page)

      setPatients(result.patients)
      setTotalPatients(result.total)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setPageSize(size)
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
      loadPatients(1, pageSize)
    }
  }, [initialPatients, serverUrl])

  useEffect(() => {
    if (initialPatients) {
      setPatients(initialPatients)
    }
  }, [initialPatients])

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    const size = Number.parseInt(newSize)
    setPageSize(size)

    if (paginationData && searchParams) {
      loadSearchPage(1, size) // Reset to first page when changing page size for search results
    } else {
      loadPatients(1, size) // Reset to first page when changing page size
    }
  }

  // Handle page navigation
  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    if (paginationData && searchParams) {
      loadSearchPage(page, pageSize)
    } else {
      loadPatients(page, pageSize)
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
    if (!patients) return []

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
                onClick={() => loadPatients(currentPage, pageSize)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                    ? loadSearchPage(currentPage, pageSize)
                    : loadPatients(currentPage, pageSize)
                }
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-4">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-4">No patients found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Last Updated</TableHead>
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
        )}
      </CardContent>

      {!loading && totalPages > 1 && (
        <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalPatients)} of{" "}
            {totalPatients} patients
          </div>

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

            <div className="flex items-center space-x-1">
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
        </CardFooter>
      )}
    </Card>
  )
}

