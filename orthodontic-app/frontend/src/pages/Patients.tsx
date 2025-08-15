import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  UserPlusIcon, 
  FunnelIcon, 
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Table, { Column } from '@components/common/Table'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import Modal, { ConfirmModal } from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'
import PatientList from '@components/patients/PatientList'
import PatientFilters from '@components/patients/PatientFilters'

// API & Types
import { patientApi } from '@api/patientApi'
import { Patient, PatientFilters as IPatientFilters } from '@types/patient'

const Patients = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // State
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [filters, setFilters] = useState<IPatientFilters>({
    search: '',
    status: 'all',
    ageRange: 'all',
    treatmentStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; patientId?: string }>({
    isOpen: false
  })

  // API Queries
  const { 
    data: patientsData, 
    isLoading, 
    error 
  } = useQuery(
    ['patients', filters],
    () => patientApi.getPatients(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  const deletePatientMutation = useMutation(
    (patientId: string) => patientApi.deletePatient(patientId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients')
        toast.success('Ο ασθενής διαγράφηκε επιτυχώς')
        setDeleteModal({ isOpen: false })
      },
      onError: (error: any) => {
        toast.error('Σφάλμα κατά τη διαγραφή του ασθενή')
        console.error('Delete patient error:', error)
      }
    }
  )

  const bulkDeleteMutation = useMutation(
    (patientIds: string[]) => patientApi.bulkDeletePatients(patientIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients')
        toast.success(`${selectedPatients.length} ασθενείς διαγράφηκαν επιτυχώς`)
        setSelectedPatients([])
      },
      onError: (error: any) => {
        toast.error('Σφάλμα κατά τη μαζική διαγραφή')
        console.error('Bulk delete error:', error)
      }
    }
  )

  // Handlers
  const handleSearch = (searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }))
  }

  const handleFilterChange = (newFilters: Partial<IPatientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handlePatientSelect = (patientId: string) => {
    navigate(`/patients/${patientId}`)
  }

  const handleEditPatient = (patientId: string) => {
    navigate(`/patients/${patientId}/edit`)
  }

  const handleDeletePatient = (patientId: string) => {
    setDeleteModal({ isOpen: true, patientId })
  }

  const confirmDelete = () => {
    if (deleteModal.patientId) {
      deletePatientMutation.mutate(deleteModal.patientId)
    }
  }

  const handleBulkDelete = () => {
    if (selectedPatients.length > 0) {
      bulkDeleteMutation.mutate(selectedPatients)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await patientApi.exportPatients(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `patients-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Η εξαγωγή ολοκληρώθηκε επιτυχώς')
    } catch (error) {
      toast.error('Σφάλμα κατά την εξαγωγή')
      console.error('Export error:', error)
    }
  }

  // Table columns
  const columns: Column<Patient>[] = [
    {
      key: 'name',
      title: 'Όνομα',
      dataIndex: 'name',
      sortable: true,
      render: (_, patient) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {patient.avatar ? (
              <img
                className="h-10 w-10 rounded-full"
                src={patient.avatar}
                alt={patient.name}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
            <div className="text-sm text-gray-500">{patient.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Τηλέφωνο',
      dataIndex: 'phone',
      render: (phone) => (
        <div className="flex items-center space-x-2">
          <PhoneIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{phone}</span>
        </div>
      )
    },
    {
      key: 'age',
      title: 'Ηλικία',
      dataIndex: 'age',
      sortable: true,
      render: (age) => (
        <span className="text-sm text-gray-900">{age} ετών</span>
      )
    },
    {
      key: 'treatmentStatus',
      title: 'Κατάσταση Θεραπείας',
      dataIndex: 'treatmentStatus',
      render: (status) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-800' :
          status === 'completed' ? 'bg-blue-100 text-blue-800' :
          status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status === 'active' ? 'Ενεργή' :
           status === 'completed' ? 'Ολοκληρωμένη' :
           status === 'paused' ? 'Παύση' : 'Δεν ξεκίνησε'}
        </span>
      )
    },
    {
      key: 'lastVisit',
      title: 'Τελευταία Επίσκεψη',
      dataIndex: 'lastVisit',
      sortable: true,
      render: (lastVisit) => (
        <span className="text-sm text-gray-900">
          {lastVisit ? new Date(lastVisit).toLocaleDateString('el-GR') : 'Ποτέ'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Ενέργειες',
      render: (_, patient) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePatientSelect(patient.id)}
            className="text-gray-600 hover:text-primary-600"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPatient(patient.id)}
            className="text-gray-600 hover:text-primary-600"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePatient(patient.id)}
            className="text-gray-600 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const patients = patientsData?.data || []
  const totalCount = patientsData?.total || 0

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Σφάλμα κατά τη φόρτωση των ασθενών</div>
        <Button onClick={() => queryClient.invalidateQueries('patients')}>
          Δοκιμάστε ξανά
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ασθενείς</h1>
          <p className="mt-1 text-sm text-gray-500">
            Διαχείριση και παρακολούθηση ασθενών ({totalCount} συνολικά)
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            leftIcon={<DocumentArrowDownIcon />}
          >
            Εξαγωγή
          </Button>
          
          <Button
            onClick={() => navigate('/patients/new')}
            leftIcon={<UserPlusIcon />}
          >
            Νέος Ασθενής
          </Button>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardBody padding="md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-lg">
                <Input
                  placeholder="Αναζήτηση ασθενών..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {selectedPatients.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedPatients.length} επιλεγμένα
                    </span>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={handleBulkDelete}
                      loading={bulkDeleteMutation.isLoading}
                    >
                      Διαγραφή
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<FunnelIcon />}
                >
                  Φίλτρα
                </Button>

                <Dropdown
                  options={[
                    { label: 'Προβολή πίνακα', value: 'table' },
                    { label: 'Προβολή καρτών', value: 'grid' }
                  ]}
                  value={view}
                  onChange={(value) => setView(value as 'table' | 'grid')}
                  placeholder="Προβολή"
                />
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <PatientFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              </motion.div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <Card>
            <CardBody className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500">Φόρτωση ασθενών...</p>
            </CardBody>
          </Card>
        ) : view === 'table' ? (
          <Card>
            <Table
              columns={columns}
              data={patients}
              selectedRowKeys={selectedPatients}
              onSelectionChange={(keys) => setSelectedPatients(keys)}
              onRow={(patient) => ({
                onClick: () => handlePatientSelect(patient.id)
              })}
              emptyText="Δεν βρέθηκαν ασθενείς"
              hoverable
              pagination={{
                current: 1,
                pageSize: 20,
                total: totalCount,
                onChange: (page, pageSize) => {
                  // Handle pagination
                }
              }}
            />
          </Card>
        ) : (
          <PatientList
            patients={patients}
            onPatientSelect={handlePatientSelect}
            onPatientEdit={handleEditPatient}
            onPatientDelete={handleDeletePatient}
          />
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Διαγραφή Ασθενή"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον ασθενή; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmText="Διαγραφή"
        variant="error"
        loading={deletePatientMutation.isLoading}
      />
    </div>
  )
}

export default Patients