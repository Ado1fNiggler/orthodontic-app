import { motion } from 'framer-motion'
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Card, { CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import { Patient } from '@types/patient'

interface PatientListProps {
  patients: Patient[]
  onPatientSelect: (patientId: string) => void
  onPatientEdit: (patientId: string) => void
  onPatientDelete: (patientId: string) => void
  loading?: boolean
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  onPatientSelect,
  onPatientEdit,
  onPatientDelete,
  loading = false
}) => {
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTreatmentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Δεν βρέθηκαν ασθενείς
          </h3>
          <p className="text-gray-500">
            Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης ή τα φίλτρα
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient, index) => (
        <motion.div
          key={patient.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card 
            hoverable 
            clickable
            onClick={() => onPatientSelect(patient.id)}
            className="h-full"
          >
            <CardBody>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {patient.avatar ? (
                      <img
                        className="h-12 w-12 rounded-full"
                        src={patient.avatar}
                        alt={patient.name}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {calculateAge(patient.birthDate)} ετών • {patient.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status === 'active' ? 'Ενεργός' :
                     patient.status === 'inactive' ? 'Ανενεργός' : 'Αρχειοθετημένος'}
                  </span>
                  
                  {patient.treatmentStatus && (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTreatmentStatusColor(patient.treatmentStatus)}`}>
                      {patient.treatmentStatus === 'active' ? 'Ενεργή θεραπεία' :
                       patient.treatmentStatus === 'completed' ? 'Ολοκληρωμένη' :
                       patient.treatmentStatus === 'paused' ? 'Παύση' : 'Δεν ξεκίνησε'}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{patient.phone}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>

                {patient.lastVisit && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Τελευταία επίσκεψη: {new Date(patient.lastVisit).toLocaleDateString('el-GR')}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {patient.stats && (
                <div className="grid grid-cols-3 gap-3 mb-4 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {patient.stats.totalAppointments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Επισκέψεις</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {patient.stats.activeTreatments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Θεραπείες</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      (patient.stats.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{patient.stats.outstandingBalance || 0}
                    </div>
                    <div className="text-xs text-gray-500">Υπόλοιπο</div>
                  </div>
                </div>
              )}

              {/* Notes Preview */}
              {patient.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {patient.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPatientSelect(patient.id)
                    }}
                    className="text-gray-600 hover:text-primary-600"
                    aria-label="Προβολή ασθενή"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPatientEdit(patient.id)
                    }}
                    className="text-gray-600 hover:text-primary-600"
                    aria-label="Επεξεργασία ασθενή"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPatientDelete(patient.id)
                    }}
                    className="text-gray-600 hover:text-red-600"
                    aria-label="Διαγραφή ασθενή"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Registration Date */}
                <div className="text-xs text-gray-400">
                  Εγγραφή: {new Date(patient.createdAt).toLocaleDateString('el-GR')}
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default PatientList