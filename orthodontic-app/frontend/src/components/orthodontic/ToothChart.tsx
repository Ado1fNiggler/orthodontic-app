/**
 * Tooth Chart Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/ToothChart.tsx
 */

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'

// Types
interface Tooth {
  id: number
  position: string
  quadrant: 1 | 2 | 3 | 4
  type: 'incisor' | 'canine' | 'premolar' | 'molar'
  name: string
  status: 'healthy' | 'caries' | 'filled' | 'crowned' | 'missing' | 'extracted' | 'impacted'
  notes?: string
  treatments?: Treatment[]
  condition?: string
  x: number
  y: number
}

interface Treatment {
  id: string
  type: 'bracket' | 'band' | 'wire' | 'extraction' | 'filling' | 'crown' | 'other'
  date: string
  notes?: string
  status: 'planned' | 'in-progress' | 'completed'
}

interface ToothChartProps {
  patientId?: string
  teeth?: Tooth[]
  onToothClick?: (tooth: Tooth) => void
  onToothUpdate?: (tooth: Tooth) => void
  readonly?: boolean
  showLabels?: boolean
  showQuadrants?: boolean
  notation?: 'fdi' | 'universal' | 'palmer'
  className?: string
}

interface ToothModalData {
  tooth: Tooth
  isOpen: boolean
}

const ToothChart: React.FC<ToothChartProps> = ({
  patientId,
  teeth: initialTeeth,
  onToothClick,
  onToothUpdate,
  readonly = false,
  showLabels = true,
  showQuadrants = true,
  notation = 'fdi',
  className
}) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothModalData | null>(null)
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'adult' | 'child'>('adult')

  // Default adult teeth (FDI notation)
  const defaultAdultTeeth: Tooth[] = [
    // Quadrant 1 (Upper Right)
    { id: 18, position: '18', quadrant: 1, type: 'molar', name: '3rd Molar', status: 'healthy', x: 100, y: 50 },
    { id: 17, position: '17', quadrant: 1, type: 'molar', name: '2nd Molar', status: 'healthy', x: 130, y: 50 },
    { id: 16, position: '16', quadrant: 1, type: 'molar', name: '1st Molar', status: 'healthy', x: 160, y: 50 },
    { id: 15, position: '15', quadrant: 1, type: 'premolar', name: '2nd Premolar', status: 'healthy', x: 190, y: 50 },
    { id: 14, position: '14', quadrant: 1, type: 'premolar', name: '1st Premolar', status: 'healthy', x: 220, y: 50 },
    { id: 13, position: '13', quadrant: 1, type: 'canine', name: 'Canine', status: 'healthy', x: 250, y: 50 },
    { id: 12, position: '12', quadrant: 1, type: 'incisor', name: 'Lateral Incisor', status: 'healthy', x: 280, y: 50 },
    { id: 11, position: '11', quadrant: 1, type: 'incisor', name: 'Central Incisor', status: 'healthy', x: 310, y: 50 },

    // Quadrant 2 (Upper Left)
    { id: 21, position: '21', quadrant: 2, type: 'incisor', name: 'Central Incisor', status: 'healthy', x: 340, y: 50 },
    { id: 22, position: '22', quadrant: 2, type: 'incisor', name: 'Lateral Incisor', status: 'healthy', x: 370, y: 50 },
    { id: 23, position: '23', quadrant: 2, type: 'canine', name: 'Canine', status: 'healthy', x: 400, y: 50 },
    { id: 24, position: '24', quadrant: 2, type: 'premolar', name: '1st Premolar', status: 'healthy', x: 430, y: 50 },
    { id: 25, position: '25', quadrant: 2, type: 'premolar', name: '2nd Premolar', status: 'healthy', x: 460, y: 50 },
    { id: 26, position: '26', quadrant: 2, type: 'molar', name: '1st Molar', status: 'healthy', x: 490, y: 50 },
    { id: 27, position: '27', quadrant: 2, type: 'molar', name: '2nd Molar', status: 'healthy', x: 520, y: 50 },
    { id: 28, position: '28', quadrant: 2, type: 'molar', name: '3rd Molar', status: 'healthy', x: 550, y: 50 },

    // Quadrant 3 (Lower Left)
    { id: 38, position: '38', quadrant: 3, type: 'molar', name: '3rd Molar', status: 'healthy', x: 550, y: 200 },
    { id: 37, position: '37', quadrant: 3, type: 'molar', name: '2nd Molar', status: 'healthy', x: 520, y: 200 },
    { id: 36, position: '36', quadrant: 3, type: 'molar', name: '1st Molar', status: 'healthy', x: 490, y: 200 },
    { id: 35, position: '35', quadrant: 3, type: 'premolar', name: '2nd Premolar', status: 'healthy', x: 460, y: 200 },
    { id: 34, position: '34', quadrant: 3, type: 'premolar', name: '1st Premolar', status: 'healthy', x: 430, y: 200 },
    { id: 33, position: '33', quadrant: 3, type: 'canine', name: 'Canine', status: 'healthy', x: 400, y: 200 },
    { id: 32, position: '32', quadrant: 3, type: 'incisor', name: 'Lateral Incisor', status: 'healthy', x: 370, y: 200 },
    { id: 31, position: '31', quadrant: 3, type: 'incisor', name: 'Central Incisor', status: 'healthy', x: 340, y: 200 },

    // Quadrant 4 (Lower Right)
    { id: 41, position: '41', quadrant: 4, type: 'incisor', name: 'Central Incisor', status: 'healthy', x: 310, y: 200 },
    { id: 42, position: '42', quadrant: 4, type: 'incisor', name: 'Lateral Incisor', status: 'healthy', x: 280, y: 200 },
    { id: 43, position: '43', quadrant: 4, type: 'canine', name: 'Canine', status: 'healthy', x: 250, y: 200 },
    { id: 44, position: '44', quadrant: 4, type: 'premolar', name: '1st Premolar', status: 'healthy', x: 220, y: 200 },
    { id: 45, position: '45', quadrant: 4, type: 'premolar', name: '2nd Premolar', status: 'healthy', x: 190, y: 200 },
    { id: 46, position: '46', quadrant: 4, type: 'molar', name: '1st Molar', status: 'healthy', x: 160, y: 200 },
    { id: 47, position: '47', quadrant: 4, type: 'molar', name: '2nd Molar', status: 'healthy', x: 130, y: 200 },
    { id: 48, position: '48', quadrant: 4, type: 'molar', name: '3rd Molar', status: 'healthy', x: 100, y: 200 }
  ]

  const teeth = initialTeeth || defaultAdultTeeth

  // Status colors
  const statusColors = {
    healthy: '#10B981',
    caries: '#EF4444',
    filled: '#3B82F6',
    crowned: '#F59E0B',
    missing: '#6B7280',
    extracted: '#DC2626',
    impacted: '#8B5CF6'
  }

  // Treatment status options
  const statusOptions = [
    { label: 'Υγιές', value: 'healthy' },
    { label: 'Τερηδόνα', value: 'caries' },
    { label: 'Σφραγισμένο', value: 'filled' },
    { label: 'Στεφάνι', value: 'crowned' },
    { label: 'Λείπει', value: 'missing' },
    { label: 'Εξαχθέν', value: 'extracted' },
    { label: 'Ενσφηνωμένο', value: 'impacted' }
  ]

  const treatmentOptions = [
    { label: 'Bracket', value: 'bracket' },
    { label: 'Band', value: 'band' },
    { label: 'Σύρμα', value: 'wire' },
    { label: 'Εξαγωγή', value: 'extraction' },
    { label: 'Σφράγισμα', value: 'filling' },
    { label: 'Στεφάνι', value: 'crown' },
    { label: 'Άλλο', value: 'other' }
  ]

  // Get tooth by position
  const getToothByPosition = useCallback((position: string) => {
    return teeth.find(tooth => tooth.position === position)
  }, [teeth])

  // Handle tooth click
  const handleToothClick = useCallback((tooth: Tooth) => {
    if (onToothClick) {
      onToothClick(tooth)
    }
    if (!readonly) {
      setSelectedTooth({ tooth, isOpen: true })
    }
  }, [onToothClick, readonly])

  // Handle tooth update
  const handleToothUpdate = useCallback((updatedTooth: Tooth) => {
    if (onToothUpdate) {
      onToothUpdate(updatedTooth)
    }
    setSelectedTooth(null)
  }, [onToothUpdate])

  // Render tooth SVG
  const renderTooth = useCallback((tooth: Tooth) => {
    const size = tooth.type === 'molar' ? 24 : tooth.type === 'premolar' ? 20 : 18
    const color = statusColors[tooth.status]
    const isHovered = hoveredTooth === tooth.id

    return (
      <motion.g
        key={tooth.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: isHovered ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ cursor: readonly ? 'default' : 'pointer' }}
        onClick={() => handleToothClick(tooth)}
        onMouseEnter={() => setHoveredTooth(tooth.id)}
        onMouseLeave={() => setHoveredTooth(null)}
      >
        {/* Tooth shape */}
        <rect
          x={tooth.x - size/2}
          y={tooth.y - size/2}
          width={size}
          height={size}
          rx={tooth.type === 'incisor' ? 2 : 4}
          fill={color}
          stroke={isHovered ? '#1F2937' : '#374151'}
          strokeWidth={isHovered ? 2 : 1}
          opacity={tooth.status === 'missing' ? 0.3 : 1}
        />

        {/* Status indicators */}
        {tooth.status === 'caries' && (
          <circle
            cx={tooth.x + size/4}
            cy={tooth.y - size/4}
            r={3}
            fill="#DC2626"
          />
        )}

        {tooth.status === 'filled' && (
          <rect
            x={tooth.x - 3}
            y={tooth.y - 3}
            width={6}
            height={6}
            fill="#6B7280"
          />
        )}

        {tooth.status === 'crowned' && (
          <polygon
            points={`${tooth.x-4},${tooth.y+2} ${tooth.x},${tooth.y-4} ${tooth.x+4},${tooth.y+2}`}
            fill="#FBBF24"
          />
        )}

        {tooth.treatments && tooth.treatments.length > 0 && (
          <circle
            cx={tooth.x + size/3}
            cy={tooth.y + size/3}
            r={2}
            fill="#8B5CF6"
          />
        )}

        {/* Tooth number label */}
        {showLabels && (
          <text
            x={tooth.x}
            y={tooth.y + 2}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="bold"
          >
            {tooth.position}
          </text>
        )}
      </motion.g>
    )
  }, [hoveredTooth, showLabels, readonly, handleToothClick])

  // Render quadrant labels
  const renderQuadrantLabels = () => {
    if (!showQuadrants) return null

    return (
      <g>
        <text x={200} y={30} textAnchor="middle" fontSize="14" fill="#6B7280" fontWeight="bold">
          Quadrant 1 (ΑΔ)
        </text>
        <text x={450} y={30} textAnchor="middle" fontSize="14" fill="#6B7280" fontWeight="bold">
          Quadrant 2 (ΑΑ)
        </text>
        <text x={450} y={240} textAnchor="middle" fontSize="14" fill="#6B7280" fontWeight="bold">
          Quadrant 3 (ΚΑ)
        </text>
        <text x={200} y={240} textAnchor="middle" fontSize="14" fill="#6B7280" fontWeight="bold">
          Quadrant 4 (ΚΔ)
        </text>
      </g>
    )
  }

  // Render midline
  const renderMidline = () => (
    <line
      x1={325}
      y1={40}
      x2={325}
      y2={210}
      stroke="#E5E7EB"
      strokeWidth={2}
      strokeDasharray="5,5"
    />
  )

  // Get legend items
  const legendItems = useMemo(() => {
    const statusCounts = teeth.reduce((acc, tooth) => {
      acc[tooth.status] = (acc[tooth.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status as keyof typeof statusColors,
      label: statusOptions.find(opt => opt.value === status)?.label || status,
      color: statusColors[status as keyof typeof statusColors],
      count
    }))
  }, [teeth])

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Διάγραμμα Δοντιών"
          extra={
            <div className="flex items-center space-x-2">
              <Dropdown
                options={[
                  { label: 'Ενήλικας (32 δόντια)', value: 'adult' },
                  { label: 'Παιδί (20 δόντια)', value: 'child' }
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as 'adult' | 'child')}
              />
              
              {!readonly && (
                <Button size="sm" leftIcon={<PlusIcon />}>
                  Νέα θεραπεία
                </Button>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-6">
            {/* Main tooth chart */}
            <div className="flex justify-center">
              <svg width="650" height="250" className="border border-gray-200 rounded-lg bg-gray-50">
                {renderMidline()}
                {renderQuadrantLabels()}
                {teeth.map(renderTooth)}
                
                {/* Arch lines */}
                <path
                  d="M 100 50 Q 325 20 550 50"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M 100 200 Q 325 230 550 200"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {legendItems.map(({ status, label, color, count }) => (
                <div key={status} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{count} δόντια</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {teeth.filter(t => t.status === 'healthy').length}
                </div>
                <div className="text-sm text-blue-600">Υγιή δόντια</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">
                  {teeth.filter(t => ['caries', 'filled'].includes(t.status)).length}
                </div>
                <div className="text-sm text-red-600">Θεραπεία</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-600">
                  {teeth.filter(t => ['missing', 'extracted'].includes(t.status)).length}
                </div>
                <div className="text-sm text-gray-600">Λείπουν</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">
                  {teeth.filter(t => t.treatments && t.treatments.length > 0).length}
                </div>
                <div className="text-sm text-purple-600">Ορθοδοντικά</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tooth Detail Modal */}
      {selectedTooth && (
        <ToothDetailModal
          tooth={selectedTooth.tooth}
          isOpen={selectedTooth.isOpen}
          onClose={() => setSelectedTooth(null)}
          onSave={handleToothUpdate}
          statusOptions={statusOptions}
          treatmentOptions={treatmentOptions}
        />
      )}
    </div>
  )
}

// Tooth Detail Modal Component
interface ToothDetailModalProps {
  tooth: Tooth
  isOpen: boolean
  onClose: () => void
  onSave: (tooth: Tooth) => void
  statusOptions: Array<{ label: string; value: string }>
  treatmentOptions: Array<{ label: string; value: string }>
}

const ToothDetailModal: React.FC<ToothDetailModalProps> = ({
  tooth,
  isOpen,
  onClose,
  onSave,
  statusOptions,
  treatmentOptions
}) => {
  const [formData, setFormData] = useState(tooth)
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'planned' as const
  })

  const handleSave = () => {
    onSave(formData)
  }

  const addTreatment = () => {
    if (!newTreatment.type) return

    const treatment: Treatment = {
      id: `treatment-${Date.now()}`,
      ...newTreatment
    }

    setFormData(prev => ({
      ...prev,
      treatments: [...(prev.treatments || []), treatment]
    }))

    setNewTreatment({
      type: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'planned'
    })
  }

  const removeTreatment = (treatmentId: string) => {
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments?.filter(t => t.id !== treatmentId) || []
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Δόντι ${tooth.position} - ${tooth.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Κατάσταση
            </label>
            <Dropdown
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                status: value as Tooth['status'] 
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Τύπος δοντιού
            </label>
            <Input
              value={formData.type}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Σημειώσεις
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Προσθέστε σημειώσεις για αυτό το δόντι..."
          />
        </div>

        {/* Current Treatments */}
        {formData.treatments && formData.treatments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Θεραπείες</h4>
            <div className="space-y-2">
              {formData.treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {treatmentOptions.find(opt => opt.value === treatment.type)?.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(treatment.date).toLocaleDateString('el-GR')} • {treatment.status}
                    </div>
                    {treatment.notes && (
                      <div className="text-xs text-gray-600 mt-1">{treatment.notes}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTreatment(treatment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Treatment */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Προσθήκη νέας θεραπείας</h4>
          <div className="grid grid-cols-2 gap-3">
            <Dropdown
              options={treatmentOptions}
              value={newTreatment.type}
              onChange={(value) => setNewTreatment(prev => ({ ...prev, type: value as string }))}
              placeholder="Επιλέξτε θεραπεία"
            />

            <Input
              type="date"
              value={newTreatment.date}
              onChange={(e) => setNewTreatment(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="mt-3">
            <Input
              placeholder="Σημειώσεις θεραπείας..."
              value={newTreatment.notes}
              onChange={(e) => setNewTreatment(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={addTreatment}
              disabled={!newTreatment.type}
              leftIcon={<PlusIcon />}
            >
              Προσθήκη θεραπείας
            </Button>
          </div>
        </div>

        {/* Actions */}
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

export default ToothChart
export type { Tooth, Treatment }