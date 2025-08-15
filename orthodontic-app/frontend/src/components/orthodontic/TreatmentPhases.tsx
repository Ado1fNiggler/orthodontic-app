/**
 * Treatment Phases Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/TreatmentPhases.tsx
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'

// Types
interface Phase {
  id: string
  title: string
  description: string
  order: number
  status: 'not-started' | 'active' | 'completed' | 'paused' | 'skipped'
  startDate?: string
  endDate?: string
  estimatedDuration: number // in weeks
  actualDuration?: number
  estimatedCost: number
  actualCost?: number
  procedures: Procedure[]
  milestones: Milestone[]
  notes?: string
  progress: number // 0-100
}

interface Procedure {
  id: string
  title: string
  description: string
  category: 'diagnostic' | 'preparation' | 'active-treatment' | 'retention' | 'monitoring'
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  scheduledDate?: string
  completedDate?: string
  estimatedDuration: number // in minutes
  actualDuration?: number
  cost: number
  notes?: string
  attachments?: string[]
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  completedDate?: string
  status: 'pending' | 'completed' | 'overdue'
  importance: 'low' | 'medium' | 'high' | 'critical'
}

interface TreatmentPhasesProps {
  phases: Phase[]
  onPhaseUpdate?: (phase: Phase) => void
  onProcedureUpdate?: (phaseId: string, procedure: Procedure) => void
  readonly?: boolean
  showTimeline?: boolean
  className?: string
}

const TreatmentPhases: React.FC<TreatmentPhasesProps> = ({
  phases,
  onPhaseUpdate,
  onProcedureUpdate,
  readonly = false,
  showTimeline = true,
  className
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all')

  // Status options
  const phaseStatusOptions = [
    { label: 'Δεν ξεκίνησε', value: 'not-started' },
    { label: 'Ενεργή', value: 'active' },
    { label: 'Ολοκληρωμένη', value: 'completed' },
    { label: 'Παυμένη', value: 'paused' },
    { label: 'Παραλείφθηκε', value: 'skipped' }
  ]

  const procedureStatusOptions = [
    { label: 'Εκκρεμεί', value: 'pending' },
    { label: 'Προγραμματισμένη', value: 'scheduled' },
    { label: 'Σε εξέλιξη', value: 'in-progress' },
    { label: 'Ολοκληρωμένη', value: 'completed' },
    { label: 'Ακυρωμένη', value: 'cancelled' }
  ]

  const categoryOptions = [
    { label: 'Διάγνωση', value: 'diagnostic' },
    { label: 'Προετοιμασία', value: 'preparation' },
    { label: 'Ενεργή θεραπεία', value: 'active-treatment' },
    { label: 'Συγκράτηση', value: 'retention' },
    { label: 'Παρακολούθηση', value: 'monitoring' }
  ]

  const filterOptions = [
    { label: 'Όλες οι φάσεις', value: 'all' },
    { label: 'Ενεργές', value: 'active' },
    { label: 'Ολοκληρωμένες', value: 'completed' },
    { label: 'Εκκρεμείς', value: 'pending' }
  ]

  // Filter phases
  const filteredPhases = useMemo(() => {
    return phases.filter(phase => {
      switch (filter) {
        case 'active':
          return phase.status === 'active'
        case 'completed':
          return phase.status === 'completed'
        case 'pending':
          return ['not-started', 'paused'].includes(phase.status)
        default:
          return true
      }
    }).sort((a, b) => a.order - b.order)
  }, [phases, filter])

  // Calculate overall statistics
  const stats = useMemo(() => {
    const total = phases.length
    const completed = phases.filter(p => p.status === 'completed').length
    const active = phases.filter(p => p.status === 'active').length
    const pending = phases.filter(p => ['not-started', 'paused'].includes(p.status)).length
    
    const totalEstimatedCost = phases.reduce((sum, p) => sum + p.estimatedCost, 0)
    const totalActualCost = phases.reduce((sum, p) => sum + (p.actualCost || 0), 0)
    
    const totalEstimatedDuration = phases.reduce((sum, p) => sum + p.estimatedDuration, 0)
    const totalActualDuration = phases.reduce((sum, p) => sum + (p.actualDuration || 0), 0)
    
    const overallProgress = total > 0 ? phases.reduce((sum, p) => sum + p.progress, 0) / total : 0

    return {
      total,
      completed,
      active,
      pending,
      totalEstimatedCost,
      totalActualCost,
      totalEstimatedDuration,
      totalActualDuration,
      overallProgress
    }
  }, [phases])

  // Toggle phase expansion
  const togglePhaseExpansion = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId)
      } else {
        newSet.add(phaseId)
      }
      return newSet
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'skipped': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get importance color
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate phase duration
  const getPhaseDuration = (phase: Phase) => {
    if (phase.startDate && phase.endDate) {
      const start = new Date(phase.startDate)
      const end = new Date(phase.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
      return diffWeeks
    }
    return phase.estimatedDuration
  }

  // Check if phase is overdue
  const isPhaseOverdue = (phase: Phase) => {
    if (!phase.endDate || phase.status === 'completed') return false
    return new Date(phase.endDate) < new Date()
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Φάσεις Θεραπείας"
          extra={
            <div className="flex items-center space-x-3">
              <Dropdown
                options={filterOptions}
                value={filter}
                onChange={(value) => setFilter(value as any)}
                size="sm"
              />
              
              {!readonly && (
                <Button size="sm" leftIcon={<PlusIcon />}>
                  Νέα φάση
                </Button>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Σύνολο</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-600">{stats.active}</div>
                <div className="text-xs text-green-600">Ενεργές</div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-600">{stats.completed}</div>
                <div className="text-xs text-blue-600">Ολοκληρωμένες</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-yellow-600">Εκκρεμείς</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {Math.round(stats.overallProgress)}%
                </div>
                <div className="text-xs text-purple-600">Πρόοδος</div>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-indigo-600">
                  {Math.ceil(stats.totalEstimatedDuration / 4)}μ
                </div>
                <div className="text-xs text-indigo-600">Διάρκεια</div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Συνολική πρόοδος θεραπείας</span>
                <span>{Math.round(stats.overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.overallProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Timeline or List View */}
            {showTimeline ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
                
                <div className="space-y-6">
                  {filteredPhases.map((phase, index) => (
                    <PhaseTimelineItem
                      key={phase.id}
                      phase={phase}
                      index={index}
                      isExpanded={expandedPhases.has(phase.id)}
                      onToggleExpand={() => togglePhaseExpansion(phase.id)}
                      onEdit={() => {
                        setSelectedPhase(phase)
                        setIsPhaseModalOpen(true)
                      }}
                      readonly={readonly}
                      getStatusColor={getStatusColor}
                      getImportanceColor={getImportanceColor}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      isOverdue={isPhaseOverdue(phase)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPhases.map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    isExpanded={expandedPhases.has(phase.id)}
                    onToggleExpand={() => togglePhaseExpansion(phase.id)}
                    onEdit={() => {
                      setSelectedPhase(phase)
                      setIsPhaseModalOpen(true)
                    }}
                    readonly={readonly}
                    getStatusColor={getStatusColor}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    isOverdue={isPhaseOverdue(phase)}
                  />
                ))}
              </div>
            )}

            {filteredPhases.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Δεν βρέθηκαν φάσεις
                </h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'all' 
                    ? 'Δεν έχουν οριστεί φάσεις θεραπείας ακόμη'
                    : 'Δεν υπάρχουν φάσεις που να ταιριάζουν με το φίλτρο'
                  }
                </p>
                {!readonly && filter === 'all' && (
                  <Button leftIcon={<PlusIcon />}>
                    Προσθήκη πρώτης φάσης
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Phase Detail Modal */}
      {selectedPhase && (
        <PhaseDetailModal
          phase={selectedPhase}
          isOpen={isPhaseModalOpen}
          onClose={() => {
            setIsPhaseModalOpen(false)
            setSelectedPhase(null)
          }}
          onSave={(updatedPhase) => {
            onPhaseUpdate?.(updatedPhase)
            setIsPhaseModalOpen(false)
            setSelectedPhase(null)
          }}
          statusOptions={phaseStatusOptions}
          procedureStatusOptions={procedureStatusOptions}
          categoryOptions={categoryOptions}
          readonly={readonly}
        />
      )}
    </div>
  )
}

// Phase Timeline Item Component
interface PhaseTimelineItemProps {
  phase: Phase
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  readonly: boolean
  getStatusColor: (status: string) => string
  getImportanceColor: (importance: string) => string
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  isOverdue: boolean
}

const PhaseTimelineItem: React.FC<PhaseTimelineItemProps> = ({
  phase,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  readonly,
  getStatusColor,
  getImportanceColor,
  formatCurrency,
  formatDate,
  isOverdue
}) => {
  const getTimelineIcon = () => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'active':
        return <PlayIcon className="h-5 w-5 text-blue-600" />
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative ml-16"
    >
      {/* Timeline node */}
      <div className="absolute -left-10 top-6 bg-white border-2 border-gray-200 rounded-full p-2">
        {getTimelineIcon()}
      </div>

      {/* Phase content */}
      <div className={`bg-white border rounded-lg p-4 shadow-sm ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-medium text-gray-900">{phase.title}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(phase.status)}`}>
                {phase.status}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  Καθυστερημένη
                </span>
              )}
            </div>
            {phase.description && (
              <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </Button>
            {!readonly && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Phase summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {phase.estimatedDuration} εβδομάδες
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <CurrencyEuroIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {formatCurrency(phase.estimatedCost)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {phase.procedures.length} διαδικασίες
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {Math.round(phase.progress)}% πρόοδος
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              {/* Procedures */}
              {phase.procedures.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Διαδικασίες</h4>
                  <div className="space-y-2">
                    {phase.procedures.map((procedure) => (
                      <div key={procedure.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{procedure.title}</div>
                          <div className="text-xs text-gray-500">
                            {procedure.scheduledDate && formatDate(procedure.scheduledDate)}
                            {procedure.estimatedDuration && ` • ${procedure.estimatedDuration} λεπτά`}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(procedure.status)}`}>
                          {procedure.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {phase.milestones.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Ορόσημα</h4>
                  <div className="space-y-2">
                    {phase.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{milestone.title}</div>
                          <div className="text-xs text-gray-500">
                            Στόχος: {formatDate(milestone.targetDate)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImportanceColor(milestone.importance)}`}>
                            {milestone.importance}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                            {milestone.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {phase.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Σημειώσεις</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {phase.notes}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Phase Card Component (simplified version for list view)
interface PhaseCardProps {
  phase: Phase
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  readonly: boolean
  getStatusColor: (status: string) => string
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  isOverdue: boolean
}

const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  isExpanded,
  onToggleExpand,
  onEdit,
  readonly,
  getStatusColor,
  formatCurrency,
  formatDate,
  isOverdue
}) => {
  return (
    <div className={`border rounded-lg p-4 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-gray-900">{phase.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(phase.status)}`}>
              {phase.status}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <span>{phase.estimatedDuration} εβδομάδες</span>
            <span>{formatCurrency(phase.estimatedCost)}</span>
            <span>{Math.round(phase.progress)}% ολοκληρωμένη</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </Button>
          {!readonly && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Phase Detail Modal (simplified)
interface PhaseDetailModalProps {
  phase: Phase
  isOpen: boolean
  onClose: () => void
  onSave: (phase: Phase) => void
  statusOptions: Array<{ label: string; value: string }>
  procedureStatusOptions: Array<{ label: string; value: string }>
  categoryOptions: Array<{ label: string; value: string }>
  readonly: boolean
}

const PhaseDetailModal: React.FC<PhaseDetailModalProps> = ({
  phase,
  isOpen,
  onClose,
  onSave,
  statusOptions,
  readonly
}) => {
  const [formData, setFormData] = useState(phase)

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Φάση: ${phase.title}`}
      size="xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Τίτλος φάσης"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={readonly}
          />
          
          <Dropdown
            label="Κατάσταση"
            options={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as Phase['status'] }))}
            disabled={readonly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Εκτιμώμενη διάρκεια (εβδομάδες)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
            disabled={readonly}
          />

          <Input
            label="Εκτιμώμενο κόστος (€)"
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ημερομηνία έναρξης"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            disabled={readonly}
          />

          <Input
            label="Ημερομηνία λήξης"
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            disabled={readonly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Πρόοδος: {Math.round(formData.progress)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
            className="w-full"
            disabled={readonly}
          />
        </div>

        {formData.notes !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={readonly}
              placeholder="Προσθέστε σημειώσεις για αυτή τη φάση..."
            />
          </div>
        )}

        {/* Procedures section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Διαδικασίες ({formData.procedures.length})
            </h4>
            {!readonly && (
              <Button size="sm" leftIcon={<PlusIcon />}>
                Προσθήκη διαδικασίας
              </Button>
            )}
          </div>
          
          {formData.procedures.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.procedures.map((procedure) => (
                <div key={procedure.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{procedure.title}</div>
                    <div className="text-xs text-gray-500">
                      {procedure.category} • {procedure.estimatedDuration} λεπτά
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(procedure.status)}`}>
                      {procedure.status}
                    </span>
                    {!readonly && (
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              Δεν έχουν οριστεί διαδικασίες για αυτή τη φάση
            </div>
          )}
        </div>

        {/* Milestones section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Ορόσημα ({formData.milestones.length})
            </h4>
            {!readonly && (
              <Button size="sm" leftIcon={<PlusIcon />}>
                Προσθήκη οροσήμου
              </Button>
            )}
          </div>
          
          {formData.milestones.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs text-gray-500">
                      Στόχος: {formatDate(milestone.targetDate)}
                      {milestone.completedDate && ` • Ολοκληρώθηκε: ${formatDate(milestone.completedDate)}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImportanceColor(milestone.importance)}`}>
                      {milestone.importance}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              Δεν έχουν οριστεί ορόσημα για αυτή τη φάση
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {readonly ? 'Κλείσιμο' : 'Ακύρωση'}
          </Button>
          {!readonly && (
            <Button onClick={handleSave}>
              Αποθήκευση
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default TreatmentPhases
export type { Phase, Procedure, Milestone }