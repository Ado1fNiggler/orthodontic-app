import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Dropdown from '@components/common/Dropdown'
import DatePicker, { DateRangePicker } from '@components/common/DatePicker'
import Input from '@components/common/Input'

// Types
import { PatientFilters as IPatientFilters } from '@types/patient'

interface PatientFiltersProps {
  filters: IPatientFilters
  onFilterChange: (filters: Partial<IPatientFilters>) => void
  onClearFilters?: () => void
  showAdvanced?: boolean
  className?: string
}

const PatientFilters: React.FC<PatientFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  showAdvanced = false,
  className
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced)
  const [localFilters, setLocalFilters] = useState<IPatientFilters>(filters)

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Apply filters with debouncing
  const applyFilters = (newFilters: Partial<IPatientFilters>) => {
    const updatedFilters = { ...localFilters, ...newFilters }
    setLocalFilters(updatedFilters)
    onFilterChange(newFilters)
  }

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: IPatientFilters = {
      search: '',
      status: 'all',
      ageRange: 'all',
      treatmentStatus: 'all',
      gender: 'all',
      registrationDateRange: undefined,
      lastVisitDateRange: undefined,
      hasOutstandingBalance: false,
      hasInsurance: undefined,
      sortBy: 'name',
      sortOrder: 'asc'
    }
    
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
    onClearFilters?.()
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.status !== 'all' ||
      filters.ageRange !== 'all' ||
      filters.treatmentStatus !== 'all' ||
      filters.gender !== 'all' ||
      filters.registrationDateRange ||
      filters.lastVisitDateRange ||
      filters.hasOutstandingBalance ||
      filters.hasInsurance !== undefined
    )
  }

  // Filter options
  const statusOptions = [
    { label: 'Όλες οι καταστάσεις', value: 'all' },
    { label: 'Ενεργοί', value: 'active' },
    { label: 'Ανενεργοί', value: 'inactive' },
    { label: 'Αρχειοθετημένοι', value: 'archived' }
  ]

  const ageRangeOptions = [
    { label: 'Όλες οι ηλικίες', value: 'all' },
    { label: 'Παιδιά (0-12)', value: 'child' },
    { label: 'Έφηβοι (13-17)', value: 'teen' },
    { label: 'Ενήλικες (18-64)', value: 'adult' },
    { label: 'Ηλικιωμένοι (65+)', value: 'senior' }
  ]

  const treatmentStatusOptions = [
    { label: 'Όλες οι καταστάσεις', value: 'all' },
    { label: 'Ενεργή θεραπεία', value: 'active' },
    { label: 'Ολοκληρωμένη', value: 'completed' },
    { label: 'Σε παύση', value: 'paused' },
    { label: 'Δεν έχει ξεκινήσει', value: 'not_started' }
  ]

  const genderOptions = [
    { label: 'Όλα τα φύλα', value: 'all' },
    { label: 'Άνδρας', value: 'male' },
    { label: 'Γυναίκα', value: 'female' }
  ]

  const sortByOptions = [
    { label: 'Όνομα', value: 'name' },
    { label: 'Ημερομηνία εγγραφής', value: 'createdAt' },
    { label: 'Τελευταία επίσκεψη', value: 'lastVisit' },
    { label: 'Ηλικία', value: 'age' },
    { label: 'Υπόλοιπο', value: 'balance' }
  ]

  const sortOrderOptions = [
    { label: 'Αύξουσα', value: 'asc' },
    { label: 'Φθίνουσα', value: 'desc' }
  ]

  const insuranceOptions = [
    { label: 'Όλοι', value: 'all' },
    { label: 'Με ασφάλιση', value: 'true' },
    { label: 'Χωρίς ασφάλιση', value: 'false' }
  ]

  return (
    <div className={className}>
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Dropdown
          options={statusOptions}
          value={filters.status}
          onChange={(value) => applyFilters({ status: value as any })}
          placeholder="Κατάσταση"
        />

        <Dropdown
          options={ageRangeOptions}
          value={filters.ageRange}
          onChange={(value) => applyFilters({ ageRange: value as any })}
          placeholder="Ηλικιακή ομάδα"
        />

        <Dropdown
          options={treatmentStatusOptions}
          value={filters.treatmentStatus}
          onChange={(value) => applyFilters({ treatmentStatus: value as any })}
          placeholder="Κατάσταση θεραπείας"
        />

        <Dropdown
          options={genderOptions}
          value={filters.gender || 'all'}
          onChange={(value) => applyFilters({ gender: value === 'all' ? undefined : value as any })}
          placeholder="Φύλο"
        />
      </div>

      {/* Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Dropdown
          options={sortByOptions}
          value={filters.sortBy}
          onChange={(value) => applyFilters({ sortBy: value as any })}
          placeholder="Ταξινόμηση κατά"
        />

        <Dropdown
          options={sortOrderOptions}
          value={filters.sortOrder}
          onChange={(value) => applyFilters({ sortOrder: value as any })}
          placeholder="Σειρά"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          leftIcon={<AdjustmentsHorizontalIcon />}
          className="text-gray-600 hover:text-gray-800"
        >
          Προχωρημένα φίλτρα
        </Button>

        {hasActiveFilters() && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {Object.values(filters).filter(v => v && v !== 'all').length} ενεργά φίλτρα
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<XMarkIcon />}
              className="text-gray-500 hover:text-red-600"
            >
              Εκκαθάριση
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <Card variant="outlined">
            <CardBody>
              <div className="space-y-6">
                {/* Date Filters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Φίλτρα Ημερομηνιών
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Περίοδος Εγγραφής
                      </label>
                      <DateRangePicker
                        startDate={filters.registrationDateRange?.start}
                        endDate={filters.registrationDateRange?.end}
                        onChange={(start, end) => 
                          applyFilters({ 
                            registrationDateRange: start && end ? { start, end } : undefined 
                          })
                        }
                        placeholder="Επιλογή περιόδου εγγραφής"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Περίοδος Τελευταίας Επίσκεψης
                      </label>
                      <DateRangePicker
                        startDate={filters.lastVisitDateRange?.start}
                        endDate={filters.lastVisitDateRange?.end}
                        onChange={(start, end) => 
                          applyFilters({ 
                            lastVisitDateRange: start && end ? { start, end } : undefined 
                          })
                        }
                        placeholder="Επιλογή περιόδου επίσκεψης"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Filters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                    Οικονομικά Φίλτρα
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ελάχιστο Υπόλοιπο (€)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={filters.minBalance || ''}
                        onChange={(e) => 
                          applyFilters({ 
                            minBalance: e.target.value ? parseFloat(e.target.value) : undefined 
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Μέγιστο Υπόλοιπο (€)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={filters.maxBalance || ''}
                        onChange={(e) => 
                          applyFilters({ 
                            maxBalance: e.target.value ? parseFloat(e.target.value) : undefined 
                          })
                        }
                        placeholder="1000.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ασφάλιση
                      </label>
                      <Dropdown
                        options={insuranceOptions}
                        value={filters.hasInsurance === undefined ? 'all' : filters.hasInsurance.toString()}
                        onChange={(value) => 
                          applyFilters({ 
                            hasInsurance: value === 'all' ? undefined : value === 'true' 
                          })
                        }
                        placeholder="Κατάσταση ασφάλισης"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasOutstandingBalance || false}
                        onChange={(e) => applyFilters({ hasOutstandingBalance: e.target.checked })}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Μόνο ασθενείς με εκκρεμή οφειλή
                      </span>
                    </label>
                  </div>
                </div>

                {/* Additional Filters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Πρόσθετα Φίλτρα
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasAllergies || false}
                        onChange={(e) => applyFilters({ hasAllergies: e.target.checked })}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Έχει αλλεργίες
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasMedications || false}
                        onChange={(e) => applyFilters({ hasMedications: e.target.checked })}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Λαμβάνει φάρμακα
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasEmergencyContact || false}
                        onChange={(e) => applyFilters({ hasEmergencyContact: e.target.checked })}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Έχει επαφή έκτακτης ανάγκης
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasPhotos || false}
                        onChange={(e) => applyFilters({ hasPhotos: e.target.checked })}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Έχει φωτογραφίες
                      </span>
                    </label>
                  </div>
                </div>

                {/* Search in Specific Fields */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Αναζήτηση σε Συγκεκριμένα Πεδία
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Αναζήτηση στο επάγγελμα"
                      value={filters.occupationSearch || ''}
                      onChange={(e) => applyFilters({ occupationSearch: e.target.value })}
                      placeholder="π.χ. δάσκαλος, γιατρός"
                    />

                    <Input
                      label="Αναζήτηση στη διεύθυνση"
                      value={filters.addressSearch || ''}
                      onChange={(e) => applyFilters({ addressSearch: e.target.value })}
                      placeholder="π.χ. Θεσσαλονίκη, Αθήνα"
                    />

                    <Input
                      label="Αναζήτηση στις σημειώσεις"
                      value={filters.notesSearch || ''}
                      onChange={(e) => applyFilters({ notesSearch: e.target.value })}
                      placeholder="Αναζήτηση στις σημειώσεις"
                    />

                    <Input
                      label="Αναζήτηση στο ιατρικό ιστορικό"
                      value={filters.medicalHistorySearch || ''}
                      onChange={(e) => applyFilters({ medicalHistorySearch: e.target.value })}
                      placeholder="Αλλεργίες, φάρμακα, κλπ"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters() && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-800">
                Ενεργά φίλτρα:
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-primary-600 hover:text-primary-800"
            >
              Εκκαθάριση όλων
            </Button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Κατάσταση: {statusOptions.find(o => o.value === filters.status)?.label}
                <button
                  onClick={() => applyFilters({ status: 'all' })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.ageRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Ηλικία: {ageRangeOptions.find(o => o.value === filters.ageRange)?.label}
                <button
                  onClick={() => applyFilters({ ageRange: 'all' })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.treatmentStatus !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Θεραπεία: {treatmentStatusOptions.find(o => o.value === filters.treatmentStatus)?.label}
                <button
                  onClick={() => applyFilters({ treatmentStatus: 'all' })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.gender && filters.gender !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Φύλο: {genderOptions.find(o => o.value === filters.gender)?.label}
                <button
                  onClick={() => applyFilters({ gender: undefined })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.hasOutstandingBalance && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Με εκκρεμή οφειλή
                <button
                  onClick={() => applyFilters({ hasOutstandingBalance: false })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.registrationDateRange && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Εγγραφή: {filters.registrationDateRange.start.toLocaleDateString('el-GR')} - {filters.registrationDateRange.end.toLocaleDateString('el-GR')}
                <button
                  onClick={() => applyFilters({ registrationDateRange: undefined })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.lastVisitDateRange && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Επίσκεψη: {filters.lastVisitDateRange.start.toLocaleDateString('el-GR')} - {filters.lastVisitDateRange.end.toLocaleDateString('el-GR')}
                <button
                  onClick={() => applyFilters({ lastVisitDateRange: undefined })}
                  className="ml-1 hover:text-primary-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PatientFilters