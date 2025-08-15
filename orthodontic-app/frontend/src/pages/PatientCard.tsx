import { motion } from 'framer-motion'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarDaysIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import Card, { CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import { Patient } from '@types/patient'

interface PatientCardProps {
  patient: Patient
  onSelect?: () => void
  onEdit?: () => void
  onTakePhoto?: () => void
  showActions?: boolean
  compact?: boolean
  animate?: boolean
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelect,
  onEdit,
  onTakePhoto,
  showActions = true,
  compact = false,
  animate = true
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTreatmentStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ενεργή θεραπεία', color: 'bg-green-100 text-green-800' }
      case 'completed':
        return { label: 'Ολοκληρωμένη', color: 'bg-blue-100 text-blue-800' }
      case 'paused':
        return { label: 'Σε παύση', color: 'bg-yellow-100 text-yellow-800' }
      case 'not_started':
        return { label: 'Δεν ξεκίνησε', color: 'bg-gray-100 text-gray-800' }
      default:
        return { label: 'Άγνωστη', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const cardContent = (
    <Card 
      hoverable={!!onSelect} 
      clickable={!!onSelect}
      onClick={onSelect}
      className={`transition-all duration-200 ${compact ? 'h-auto' : 'h-full'}`}
    >
      <CardBody padding={compact ? 'sm' : 'md'}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {patient.avatar ? (
                <img
                  className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full object-cover`}
                  src={patient.avatar}
                  alt={patient.name}
                />
              ) : (
                <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center`}>
                  <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white`}>
                    {getInitials(patient.name)}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 truncate`}>
                {patient.name}
              </h3>
              <p className="text-sm text-gray-500">
                {calculateAge(patient.birthDate)} ετών • {patient.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}
              </p>
              {patient.occupation && !compact && (
                <p className="text-xs text-gray-400 mt-1">{patient.occupation}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end space-y-1">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(patient.status)}`}>
              {patient.status === 'active' ? 'Ενεργός' :
               patient.status === 'inactive' ? 'Ανενεργός' : 'Αρχειοθετημένος'}
            </span>
          </div>
        </div>

        {/* Treatment Status */}
        {patient.treatmentStatus && !compact && (
          <div className="mb-3">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTreatmentStatusInfo(patient.treatmentStatus).color}`}>
              {getTreatmentStatusInfo(patient.treatmentStatus).label}
            </span>
          </div>
        )}

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
              <span className="text-xs">
                Τελευταία: {new Date(patient.lastVisit).toLocaleDateString('el-GR')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {patient.stats && !compact && (
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

        {/* Compact Stats */}
        {patient.stats && compact && (
          <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {patient.stats.totalAppointments || 0} επισκέψεις
            </div>
            <div className={`text-xs font-medium ${
              (patient.stats.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              €{patient.stats.outstandingBalance || 0}
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {patient.notes && !compact && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {patient.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex space-x-1">
              {onSelect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                  }}
                  className="text-gray-600 hover:text-primary-600"
                  aria-label="Προβολή ασθενή"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              )}
              
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="text-gray-600 hover:text-primary-600"
                  aria-label="Επεξεργασία ασθενή"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              )}
              
              {onTakePhoto && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTakePhoto()
                  }}
                  className="text-gray-600 hover:text-primary-600"
                  aria-label="Λήψη φωτογραφίας"
                >
                  <CameraIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Registration Date */}
            <div className="text-xs text-gray-400">
              {compact ? new Date(patient.createdAt).getFullYear() : 
               `Εγγραφή: ${new Date(patient.createdAt).toLocaleDateString('el-GR')}`}
            </div>
          </div>
        )}

        {/* Urgent Indicators */}
        {patient.urgentFlags && patient.urgentFlags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {patient.urgentFlags.map((flag, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next Appointment Indicator */}
        {patient.nextAppointment && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Επόμενο ραντεβού:</span>
              <span className="text-xs font-medium text-primary-600">
                {new Date(patient.nextAppointment).toLocaleDateString('el-GR')}
              </span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {cardContent}
      </motion.div>
    )
  }

  return cardContent
}

export default PatientCard