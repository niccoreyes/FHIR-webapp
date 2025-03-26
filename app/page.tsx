"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PatientList from "@/components/patient-list"
import CreatePatient from "@/components/create-patient"
import AdvancedSearch from "@/components/advanced-search"
import PatientDetail from "@/components/patient-detail"
import PatientDashboard from "@/components/patient-dashboard"
import ServerSelector from "@/components/server-selector"
import { ServerProvider } from "@/contexts/server-context"

export default function Home() {
  const [activeTab, setActiveTab] = useState("search")
  const [searchResults, setSearchResults] = useState(null)
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  const handleSearchResults = (results) => {
    setSearchResults(results)
  }

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId)
  }

  const handleBackToSearch = () => {
    setSelectedPatientId(null)
  }

  return (
    <ServerProvider>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">FHIR Patient Management</h1>
          <ServerSelector />
        </div>

        {selectedPatientId ? (
          <PatientDetail patientId={selectedPatientId} onBack={handleBackToSearch} />
        ) : (
          <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="view">View Patients</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="create">Create Patient</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <div className="space-y-6">
                <AdvancedSearch onSearchResults={handleSearchResults} />

                {searchResults && (
                  <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Search Results ({searchResults.total} patients found)</h2>

                    {searchResults.patients.length === 0 ? (
                      <div className="text-center py-8 bg-muted rounded-lg">
                        <p className="text-lg">No patients found matching your search criteria.</p>
                        <p className="text-muted-foreground mt-2">Try adjusting your search parameters.</p>
                      </div>
                    ) : (
                      <PatientList
                        initialPatients={searchResults.patients}
                        onPatientSelect={handlePatientSelect}
                        hideSearch={true}
                        paginationData={searchResults}
                      />
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="view" className="mt-6">
              <PatientList onPatientSelect={handlePatientSelect} />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <PatientDashboard />
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <CreatePatient onSuccess={() => setActiveTab("view")} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ServerProvider>
  )
}

