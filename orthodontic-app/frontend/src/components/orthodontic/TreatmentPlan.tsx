/**
 * Treatment Plan Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/TreatmentPlan.tsx
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  UserIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Types
interface TreatmentPlan {
  id: string
  patientId: string
  title: string
  description: string
  diagnosis: string
  objectives: string[]
  phases: TreatmentPhase[]
  estimatedDuration: number // in months
  estimatedCost: number
  status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  createdBy: string
  notes?: string
}

interface TreatmentPhase {
  id: string
  title: string
  description: string
  procedures: Procedure[]
  estimatedDuration: number // in weeks
  estimatedCost: number
  status: 'pending' | 'active' | 'completed' | 'skipped'
  startDate?: string
  endDate?: string
  actualDuration?: number
  notes?: string
  order: number
}

interface Procedure {
  id: string
  title: string
  description: string
  category: 'consultation' | 'diagnostic' | 'treatment' | 'maintenance' | 'emergency'
  estimatedDuration: number // in minutes
  cost: number
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  scheduledDate?: string
  completedDate?: string
  notes?: string
  materials?: Material[]
}

interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
}

interface TreatmentPlanProps {
  patientId: string
  plan?: TreatmentPlan
  onSave?: (plan: TreatmentPlan) => void
  onDelete?: (planId: string) => void
  readonly?: boolean
  className?: string
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({
  patientId,
  plan: initialPlan,
  onSave,
  onDelete,
  readonly = false,
  className
}) => {
  const [plan, setPlan] = useState<TreatmentPlan>(
    initialPlan || {
      id: `plan-${Date.now()}`,
      patientId,
      title: '',
      description: '',
      diagnosis: '',
      objectives: [],
      phases: [],
      estimatedDuration: 0,
      estimatedCost: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user' // This should come from auth context
    }
  )

  const [isEditing, setIsEditing] = useState(!initialPlan)
  const [selectedPhase, setSelectedPhase] = useState<TreatmentPhase | null>(null)
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
  const [newObjective, setNewObjective] = useState('')

  // Status options
  const planStatusOptions = [
    { label: 'Πρόχειρο', value: 'draft' },
    { label: 'Εγκεκριμένο', value: 'approved' },
    { label: 'Ενεργό', value: 'active' },
    { label: 'Ολοκληρωμένο', value: 'completed' },
    { label: 'Ακυρωμένο', value: 'cancelled' }
  ]

  const phaseStatusOptions = [
    { label: 'Εκκρεμεί', value: 'pending' },
    { label: 'Ενεργή', value: 'active' },
    { label: 'Ολοκληρωμένη', value: 'completed' },
    { label: 'Παραλείφθηκε', value: 'skipped' }
  ]

  const procedureCategoryOptions = [
    { label: 'Συνεδρία', value: 'consultation' },
    { label: 'Διάγνωση', value: 'diagnostic' },
    { label: 'Θεραπεία', value: 'treatment' },
    { label: 'Συντήρηση', value: 'maintenance' },
    { label: 'Επείγον', value: 'emergency' }
  ]

  // Calculate totals
  const totals = useMemo(() => {
    const totalDuration = plan.phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0)
    const totalCost = plan.phases.reduce((sum, phase) => sum + phase.estimatedCost, 0)
    const completedPhases = plan.phases.filter(phase => phase.status === 'completed').length
    const totalProcedures = plan.phases.reduce((sum, phase) => sum + phase.procedures.length, 0)
    const completedProcedures = plan.phases.reduce(
      (sum, phase) => sum + phase.procedures.filter(proc => proc.status === 'completed').length,
      0
    )

    return {
      totalDuration,
      totalCost,
      completedPhases,
      totalPhases: plan.phases.length,
      completedProcedures,
      totalProcedures,
      progress: plan.phases.length > 0 ? (completedPhases / plan.phases.length) * 100 : 0
    }
  }, [plan.phases])

  // Handle plan update
  const updatePlan = (updates: Partial<TreatmentPlan>) => {
    setPlan(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
  }

  // Add objective
  const addObjective = () => {
    if (!newObjective.trim()) return
    
    updatePlan({
      objectives: [...plan.objectives, newObjective.trim()]
    })
    setNewObjective('')
  }

  // Remove objective
  const removeObjective = (index: number) => {
    updatePlan({
      objectives: plan.objectives.filter((_, i) => i !== index)
    })
  }

  // Add phase
  const addPhase = () => {
    const newPhase: TreatmentPhase = {
      id: `phase-${Date.now()}`,
      title: `Φάση ${plan.phases.length + 1}`,
      description: '',
      procedures: [],
      estimatedDuration: 4, // 4 weeks default
      estimatedCost: 0,
      status: 'pending',
      order: plan.phases.length + 1
    }

    setSelectedPhase(newPhase)
    setIsPhaseModalOpen(true)
  }

  // Edit phase
  const editPhase = (phase: TreatmentPhase) => {
    setSelectedPhase(phase)
    setIsPhaseModalOpen(true)
  }

  // Save phase
  const savePhase = (phase: TreatmentPhase) => {
    const existingIndex = plan.phases.findIndex(p => p.id === phase.id)
    
    if (existingIndex >= 0) {
      // Update existing phase
      const updatedPhases = [...plan.phases]
      updatedPhases[existingIndex] = phase
      updatePlan({ phases: updatedPhases })
    } else {
      // Add new phase
      updatePlan({ phases: [...plan.phases, phase] })
    }
    
    setIsPhaseModalOpen(false)
    setSelectedPhase(null)
  }

  // Delete phase
  const deletePhase = (phaseId: string) => {
    if (confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτή τη φάση;')) {
      updatePlan({
        phases: plan.phases.filter(phase => phase.id !== phaseId)
      })
    }
  }

  // Handle save
  const handleSave = () => {
    if (!plan.title.trim()) {
      alert('Παρακαλώ εισάγετε τίτλο για το σχέδιο θεραπείας')
      return
    }

    // Update estimated totals
    const updatedPlan = {
      ...plan,
      estimatedDuration: Math.ceil(totals.totalDuration / 4), // Convert weeks to months
      estimatedCost: totals.totalCost
    }

    onSave?.(updatedPlan)
    setIsEditing(false)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'skipped': return 'bg-gray-100 text-gray-800'
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

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title={plan.title || 'Νέο Σχέδιο Θεραπείας'}
          extra={
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
                {planStatusOptions.find(opt => opt.value === plan.status)?.label}
              </span>
              
              {!readonly && (
                <>
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Ακύρωση
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        Αποθήκευση
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        leftIcon={<PencilIcon />}
                      >
                        Επεξεργασία
                      </Button>
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(plan.id)}
                          className="text-red-600 hover:text-red-700"
                          leftIcon={<TrashIcon />}
                        >
                          Διαγραφή
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {totals.totalPhases}
                </div>
                <div className="text-sm text-blue-600">Φάσεις</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {totals.totalProcedures}
                </div>
                <div className="text-sm text-green-600">Διαδικασίες</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">
                  {Math.ceil(totals.totalDuration / 4)} μήνες
                </div>
                <div className="text-sm text-purple-600">Διάρκεια</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">
                  {formatCurrency(totals.totalCost)}
                </div>
                <div className="text-sm text-yellow-600">Κόστος</div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-indigo-600">
                  {Math.round(totals.progress)}%
                </div>
                <div className="text-sm text-indigo-600">Πρόοδος</div>
              </div>
            </div>

            {/* Progress Bar */}
            {totals.totalPhases > 0 && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Πρόοδος θεραπείας</span>
                  <span>{totals.completedPhases}/{totals.totalPhases} φάσεις</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-primary-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totals.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Τίτλος σχεδίου
                </label>
                {isEditing ? (
                  <Input
                    value={plan.title}
                    onChange={(e) => updatePlan({ title: e.target.value })}
                    placeholder="π.χ. Ορθοδοντική θεραπεία με brackets"
                  />
                ) : (
                  <p className="text-gray-900">{plan.title || 'Χωρίς τίτλο'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Κατάσταση
                </label>
                {isEditing ? (
                  <Dropdown
                    options={planStatusOptions}
                    value={plan.status}
                    onChange={(value) => updatePlan({ status: value as TreatmentPlan['status'] })}
                  />
                ) : (
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(plan.status)}`}>
                    {planStatusOptions.find(opt => opt.value === plan.status)?.label}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Περιγραφή
              </label>
              {isEditing ? (
                <textarea
                  value={plan.description}
                  onChange={(e) => updatePlan({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Περιγράψτε το σχέδιο θεραπείας..."
                />
              ) : (
                <p className="text-gray-700">{plan.description || 'Χωρίς περιγραφή'}</p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Διάγνωση
              </label>
              {isEditing ? (
                <textarea
                  value={plan.diagnosis}
                  onChange={(e) => updatePlan({ diagnosis: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Εισάγετε τη διάγνωση..."
                />
              ) : (
                <p className="text-gray-700">{plan.diagnosis || 'Χωρίς διάγνωση'}</p>
              )}
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Στόχοι θεραπείας
              </label>
              
              <div className="space-y-2">
                {plan.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">{objective}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Προσθέστε νέο στόχο..."
                      onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                    />
                    <Button size="sm" onClick={addObjective} disabled={!newObjective.trim()}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Treatment Phases */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Φάσεις θεραπείας</h3>
                {isEditing && (
                  <Button size="sm" onClick={addPhase} leftIcon={<PlusIcon />}>
                    Προσθήκη φάσης
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {plan.phases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Δεν έχουν οριστεί φάσεις θεραπείας</p>
                    {isEditing && (
                      <Button className="mt-2" onClick={addPhase}>
                        Προσθήκη πρώτης φάσης
                      </Button>
                    )}
                  </div>
                ) : (
                  plan.phases
                    .sort((a, b) => a.order - b.order)
                    .map((phase, index) => (
                      <PhaseCard
                        key={phase.id}
                        phase={phase}
                        index={index + 1}
                        isEditing={isEditing}
                        onEdit={() => editPhase(phase)}
                        onDelete={() => deletePhase(phase.id)}
                        formatCurrency={formatCurrency}
                        getStatusColor={getStatusColor}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Notes */}
            {(plan.notes || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Επιπλέον σημειώσεις
                </label>
                {isEditing ? (
                  <textarea
                    value={plan.notes || ''}
                    onChange={(e) => updatePlan({ notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Προσθέστε επιπλέον σημειώσεις..."
                  />
                ) : (
                  <p className="text-gray-700">{plan.notes}</p>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Phase Modal */}
      {selectedPhase && (
        <PhaseModal
          phase={selectedPhase}
          isOpen={isPhaseModalOpen}
          onClose={() => {
            setIsPhaseModalOpen(false)
            setSelectedPhase(null)
          }}
          onSave={savePhase}
          phaseStatusOptions={phaseStatusOptions}
          procedureCategoryOptions={procedureCategoryOptions}
        />
      )}
    </div>
  )
}

// Phase Card Component
interface PhaseCardProps {
  phase: TreatmentPhase
  index: number
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  formatCurrency: (amount: number) => string
  getStatusColor: (status: string) => string
}

const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  index,
  isEditing,
  onEdit,
  onDelete,
  formatCurrency,
  getStatusColor
}) => {
  const completedProcedures = phase.procedures.filter(p => p.status === 'completed').length
  const progress = phase.procedures.length > 0 ? (completedProcedures / phase.procedures.length) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded">
              Φάση {index}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(phase.status)}`}>
              {phase.status}
            </span>
          </div>
          <h4 className="font-medium text-gray-900">{phase.title}</h4>
          {phase.description && (
            <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex space-x-1 ml-4">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Διάρκεια:</span>
          <span className="ml-1 font-medium">{phase.estimatedDuration} εβδομάδες</span>
        </div>
        <div>
          <span className="text-gray-500">Κόστος:</span>
          <span className="ml-1 font-medium">{formatCurrency(phase.estimatedCost)}</span>
        </div>
        <div>
          <span className="text-gray-500">Διαδικασίες:</span>
          <span className="ml-1 font-medium">{phase.procedures.length}</span>
        </div>
      </div>

      {phase.procedures.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Πρόοδος</span>
            <span>{completedProcedures}/{phase.procedures.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Phase Modal Component (simplified - full implementation would be more complex)
interface PhaseModalProps {
  phase: TreatmentPhase
  isOpen: boolean
  onClose: () => void
  onSave: (phase: TreatmentPhase) => void
  phaseStatusOptions: Array<{ label: string; value: string }>
  procedureCategoryOptions: Array<{ label: string; value: string }>
}

const PhaseModal: React.FC<PhaseModalProps> = ({
  phase,
  isOpen,
  onClose,
  onSave,
  phaseStatusOptions
}) => {
  const [formData, setFormData] = useState(phase)

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Επεξεργασία φάσης: ${phase.title}`}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Τίτλος φάσης"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Εκτιμώμενη διάρκεια (εβδομάδες)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
          />

          <Input
            label="Εκτιμώμενο κόστος (€)"
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
          />
        </div>

        <Dropdown
          label="Κατάσταση"
          options={phaseStatusOptions}
          value={formData.status}
          onChange={(value) => setFormData(prev => ({ ...prev, status: value as TreatmentPhase['status'] }))}
        />

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button onClick={handleSave}>
            Αποθήκευση
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TreatmentPlan
export type { TreatmentPlan, TreatmentPhase, Procedure }