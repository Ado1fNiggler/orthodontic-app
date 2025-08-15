/**
 * Bracket Manager Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/BracketManager.tsx
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Types
interface Bracket {
  id: string
  toothId: number
  toothPosition: string
  type: 'metal' | 'ceramic' | 'self-ligating' | 'lingual' | 'clear'
  brand: string
  size: string
  slot: '0.018' | '0.022'
  torque: number
  angulation: number
  status: 'planned' | 'placed' | 'adjusted' | 'removed' | 'replaced'
  placementDate?: string
  removalDate?: string
  notes?: string
  complications?: Complication[]
  adjustments?: Adjustment[]
}

interface Wire {
  id: string
  arch: 'upper' | 'lower' | 'both'
  material: 'stainless-steel' | 'niti' | 'beta-titanium' | 'copper-niti'
  size: string
  type: 'round' | 'rectangular' | 'braided'
  status: 'active' | 'removed' | 'replaced'
  placementDate: string
  removalDate?: string
  sequence: number
  notes?: string
}

interface Adjustment {
  id: string
  date: string
  type: 'activation' | 'replacement' | 'repair' | 'removal'
  description: string
  force: number // in grams
  notes?: string
  nextAppointment?: string
}

interface Complication {
  id: string
  type: 'debonding' | 'fracture' | 'irritation' | 'demineralization' | 'other'
  date: string
  description: string
  treatment: string
  resolved: boolean
  resolvedDate?: string
}

interface BracketManagerProps {
  patientId: string
  brackets?: Bracket[]
  wires?: Wire[]
  onBracketUpdate?: (bracket: Bracket) => void
  onWireUpdate?: (wire: Wire) => void
  onBracketAdd?: (bracket: Bracket) => void
  onWireAdd?: (wire: Wire) => void
  readonly?: boolean
  className?: string
}

const BracketManager: React.FC<BracketManagerProps> = ({
  patientId,
  brackets = [],
  wires = [],
  onBracketUpdate,
  onWireUpdate,
  onBracketAdd,
  onWireAdd,
  readonly = false,
  className
}) => {
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null)
  const [selectedWire, setSelectedWire] = useState<Wire | null>(null)
  const [isBracketModalOpen, setIsBracketModalOpen] = useState(false)
  const [isWireModalOpen, setIsWireModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'brackets' | 'wires' | 'timeline'>('brackets')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterArch, setFilterArch] = useState<'all' | 'upper' | 'lower'>('all')

  // Options for dropdowns
  const bracketTypeOptions = [
    { label: 'Μεταλλικά', value: 'metal' },
    { label: 'Κεραμικά', value: 'ceramic' },
    { label: 'Αυτοδεσμευόμενα', value: 'self-ligating' },
    { label: 'Γλωσσικά', value: 'lingual' },
    { label: 'Διάφανα', value: 'clear' }
  ]

  const bracketStatusOptions = [
    { label: 'Προγραμματισμένα', value: 'planned' },
    { label: 'Τοποθετημένα', value: 'placed' },
    { label: 'Ρυθμισμένα', value: 'adjusted' },
    { label: 'Αφαιρεμένα', value: 'removed' },
    { label: 'Αντικατασταθέντα', value: 'replaced' }
  ]

  const wireOptions = [
    { label: 'Όλα', value: 'all' },
    { label: 'Ενεργά', value: 'active' },
    { label: 'Αφαιρεμένα', value: 'removed' },
    { label: 'Αντικατασταθέντα', value: 'replaced' }
  ]

  const archOptions = [
    { label: 'Όλες οι αψίδες', value: 'all' },
    { label: 'Άνω αψίδα', value: 'upper' },
    { label: 'Κάτω αψίδα', value: 'lower' }
  ]

  const slotOptions = [
    { label: '0.018"', value: '0.018' },
    { label: '0.022"', value: '0.022' }
  ]

  const wireMaterialOptions = [
    { label: 'Ανοξείδωτος χάλυβας', value: 'stainless-steel' },
    { label: 'NiTi', value: 'niti' },
    { label: 'Beta-Titanium', value: 'beta-titanium' },
    { label: 'Copper NiTi', value: 'copper-niti' }
  ]

  const wireTypeOptions = [
    { label: 'Στρογγυλό', value: 'round' },
    { label: 'Ορθογώνιο', value: 'rectangular' },
    { label: 'Πλεκτό', value: 'braided' }
  ]

  // Filter brackets and wires
  const filteredBrackets = useMemo(() => {
    return brackets.filter(bracket => {
      if (filterStatus !== 'all' && bracket.status !== filterStatus) return false
      if (filterArch !== 'all') {
        const isUpperTooth = bracket.toothId >= 11 && bracket.toothId <= 28
        const isLowerTooth = bracket.toothId >= 31 && bracket.toothId <= 48
        if (filterArch === 'upper' && !isUpperTooth) return false
        if (filterArch === 'lower' && !isLowerTooth) return false
      }
      return true
    })
  }, [brackets, filterStatus, filterArch])

  const filteredWires = useMemo(() => {
    return wires.filter(wire => {
      if (filterStatus !== 'all' && wire.status !== filterStatus) return false
      if (filterArch !== 'all' && wire.arch !== filterArch && wire.arch !== 'both') return false
      return true
    }).sort((a, b) => b.sequence - a.sequence)
  }, [wires, filterStatus, filterArch])

  // Statistics
  const stats = useMemo(() => {
    const totalBrackets = brackets.length
    const placedBrackets = brackets.filter(b => ['placed', 'adjusted'].includes(b.status)).length
    const plannedBrackets = brackets.filter(b => b.status === 'planned').length
    const complications = brackets.reduce((sum, b) => sum + (b.complications?.length || 0), 0)
    
    const activeWires = wires.filter(w => w.status === 'active').length
    const totalWires = wires.length

    return {
      totalBrackets,
      placedBrackets,
      plannedBrackets,
      complications,
      activeWires,
      totalWires,
      placementProgress: totalBrackets > 0 ? (placedBrackets / totalBrackets) * 100 : 0
    }
  }, [brackets, wires])

  // Handle bracket operations
  const handleAddBracket = () => {
    const newBracket: Bracket = {
      id: `bracket-${Date.now()}`,
      toothId: 11,
      toothPosition: '11',
      type: 'metal',
      brand: '',
      size: '',
      slot: '0.022',
      torque: 0,
      angulation: 0,
      status: 'planned'
    }
    setSelectedBracket(newBracket)
    setIsBracketModalOpen(true)
  }

  const handleEditBracket = (bracket: Bracket) => {
    setSelectedBracket(bracket)
    setIsBracketModalOpen(true)
  }

  const handleSaveBracket = (bracket: Bracket) => {
    if (brackets.find(b => b.id === bracket.id)) {
      onBracketUpdate?.(bracket)
    } else {
      onBracketAdd?.(bracket)
    }
    setIsBracketModalOpen(false)
    setSelectedBracket(null)
  }

  // Handle wire operations
  const handleAddWire = () => {
    const newWire: Wire = {
      id: `wire-${Date.now()}`,
      arch: 'upper',
      material: 'niti',
      size: '0.012',
      type: 'round',
      status: 'active',
      placementDate: new Date().toISOString().split('T')[0],
      sequence: wires.length + 1
    }
    setSelectedWire(newWire)
    setIsWireModalOpen(true)
  }

  const handleEditWire = (wire: Wire) => {
    setSelectedWire(wire)
    setIsWireModalOpen(true)
  }

  const handleSaveWire = (wire: Wire) => {
    if (wires.find(w => w.id === wire.id)) {
      onWireUpdate?.(wire)
    } else {
      onWireAdd?.(wire)
    }
    setIsWireModalOpen(false)
    setSelectedWire(null)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'placed': case 'active': return 'bg-green-100 text-green-800'
      case 'adjusted': return 'bg-blue-100 text-blue-800'
      case 'removed': return 'bg-gray-100 text-gray-800'
      case 'replaced': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get tooth arch
  const getToothArch = (toothId: number) => {
    if (toothId >= 11 && toothId <= 28) return 'Άνω'
    if (toothId >= 31 && toothId <= 48) return 'Κάτω'
    return 'Άγνωστη'
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Διαχείριση Brackets & Wires"
          extra={
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {['brackets', 'wires', 'timeline'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab === 'brackets' && 'Brackets'}
                    {tab === 'wires' && 'Wires'}
                    {tab === 'timeline' && 'Timeline'}
                  </button>
                ))}
              </div>
              
              {!readonly && (
                <div className="flex space-x-2">
                  {activeTab === 'brackets' && (
                    <Button size="sm" onClick={handleAddBracket} leftIcon={<PlusIcon />}>
                      Νέο Bracket
                    </Button>
                  )}
                  {activeTab === 'wires' && (
                    <Button size="sm" onClick={handleAddWire} leftIcon={<PlusIcon />}>
                      Νέο Wire
                    </Button>
                  )}
                </div>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-600">{stats.totalBrackets}</div>
                <div className="text-xs text-blue-600">Σύνολο Brackets</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-600">{stats.placedBrackets}</div>
                <div className="text-xs text-green-600">Τοποθετημένα</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-yellow-600">{stats.plannedBrackets}</div>
                <div className="text-xs text-yellow-600">Προγραμματισμένα</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-red-600">{stats.complications}</div>
                <div className="text-xs text-red-600">Επιπλοκές</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-purple-600">{stats.activeWires}</div>
                <div className="text-xs text-purple-600">Ενεργά Wires</div>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-indigo-600">
                  {Math.round(stats.placementProgress)}%
                </div>
                <div className="text-xs text-indigo-600">Πρόοδος</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Πρόοδος τοποθέτησης brackets</span>
                <span>{stats.placedBrackets}/{stats.totalBrackets}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.placementProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Dropdown
                options={[
                  { label: 'Όλες οι καταστάσεις', value: 'all' },
                  ...bracketStatusOptions
                ]}
                value={filterStatus}
                onChange={setFilterStatus}
                size="sm"
              />
              
              <Dropdown
                options={archOptions}
                value={filterArch}
                onChange={(value) => setFilterArch(value as any)}
                size="sm"
              />
            </div>

            {/* Content based on active tab */}
            {activeTab === 'brackets' && (
              <BracketsList
                brackets={filteredBrackets}
                onEdit={handleEditBracket}
                readonly={readonly}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                getToothArch={getToothArch}
              />
            )}

            {activeTab === 'wires' && (
              <WiresList
                wires={filteredWires}
                onEdit={handleEditWire}
                readonly={readonly}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'timeline' && (
              <TreatmentTimeline
                brackets={brackets}
                wires={wires}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Bracket Modal */}
      {selectedBracket && (
        <BracketModal
          bracket={selectedBracket}
          isOpen={isBracketModalOpen}
          onClose={() => {
            setIsBracketModalOpen(false)
            setSelectedBracket(null)
          }}
          onSave={handleSaveBracket}
          typeOptions={bracketTypeOptions}
          statusOptions={bracketStatusOptions}
          slotOptions={slotOptions}
          readonly={readonly}
        />
      )}

      {/* Wire Modal */}
      {selectedWire && (
        <WireModal
          wire={selectedWire}
          isOpen={isWireModalOpen}
          onClose={() => {
            setIsWireModalOpen(false)
            setSelectedWire(null)
          }}
          onSave={handleSaveWire}
          materialOptions={wireMaterialOptions}
          typeOptions={wireTypeOptions}
          statusOptions={wireOptions.slice(1)} // Remove 'all' option
          readonly={readonly}
        />
      )}
    </div>
  )
}

// Brackets List Component
interface BracketsListProps {
  brackets: Bracket[]
  onEdit: (bracket: Bracket) => void
  readonly: boolean
  getStatusColor: (status: string) => string
  formatDate: (date: string) => string
  getToothArch: (toothId: number) => string
}

const BracketsList: React.FC<BracketsListProps> = ({
  brackets,
  onEdit,
  readonly,
  getStatusColor,
  formatDate,
  getToothArch
}) => {
  if (brackets.length === 0) {
    return (
      <div className="text-center py-12">
        <Cog6ToothIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Δεν βρέθηκαν brackets
        </h3>
        <p className="text-gray-500">
          Δεν έχουν οριστεί brackets για αυτόν τον ασθενή
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {brackets.map((bracket, index) => (
        <motion.div
          key={bracket.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900">
                  Δόντι {bracket.toothPosition}
                </span>
                <span className="text-sm text-gray-500">
                  {getToothArch(bracket.toothId)} αψίδα
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bracket.status)}`}>
                  {bracket.status}
                </span>
                {bracket.complications && bracket.complications.length > 0 && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    {bracket.complications.length} επιπλοκές
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Τύπος:</span>
                  <span className="ml-1 font-medium">{bracket.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Torque:</span>
                  <span className="ml-1 font-medium">{bracket.torque}°</span>
                </div>
                <div>
                  <span className="text-gray-500">Angulation:</span>
                  <span className="ml-1 font-medium">{bracket.angulation}°</span>
                </div>
              </div>

              {bracket.placementDate && (
                <div className="mt-2 text-sm text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Τοποθετήθηκε: {formatDate(bracket.placementDate)}
                </div>
              )}

              {bracket.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  {bracket.notes}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button variant="ghost" size="sm" onClick={() => onEdit(bracket)}>
                {readonly ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Wires List Component
interface WiresListProps {
  wires: Wire[]
  onEdit: (wire: Wire) => void
  readonly: boolean
  getStatusColor: (status: string) => string
  formatDate: (date: string) => string
}

const WiresList: React.FC<WiresListProps> = ({
  wires,
  onEdit,
  readonly,
  getStatusColor,
  formatDate
}) => {
  if (wires.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowsRightLeftIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Δεν βρέθηκαν wires
        </h3>
        <p className="text-gray-500">
          Δεν έχουν οριστεί wires για αυτόν τον ασθενή
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {wires.map((wire, index) => (
        <motion.div
          key={wire.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900">
                  Αλληλουχία #{wire.sequence}
                </span>
                <span className="text-sm text-gray-500">
                  {wire.arch === 'both' ? 'Άνω & Κάτω' : wire.arch === 'upper' ? 'Άνω' : 'Κάτω'} αψίδα
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wire.status)}`}>
                  {wire.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Υλικό:</span>
                  <span className="ml-1 font-medium">{wire.material}</span>
                </div>
                <div>
                  <span className="text-gray-500">Μέγεθος:</span>
                  <span className="ml-1 font-medium">{wire.size}"</span>
                </div>
                <div>
                  <span className="text-gray-500">Τύπος:</span>
                  <span className="ml-1 font-medium">{wire.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Τοποθέτηση:</span>
                  <span className="ml-1 font-medium">{formatDate(wire.placementDate)}</span>
                </div>
              </div>

              {wire.removalDate && (
                <div className="mt-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Αφαίρεση: {formatDate(wire.removalDate)}
                </div>
              )}

              {wire.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  {wire.notes}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button variant="ghost" size="sm" onClick={() => onEdit(wire)}>
                {readonly ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Treatment Timeline Component
interface TreatmentTimelineProps {
  brackets: Bracket[]
  wires: Wire[]
  formatDate: (date: string) => string
  getStatusColor: (status: string) => string
}

const TreatmentTimeline: React.FC<TreatmentTimelineProps> = ({
  brackets,
  wires,
  formatDate,
  getStatusColor
}) => {
  // Combine and sort all events by date
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string
      date: string
      type: 'bracket-placement' | 'bracket-removal' | 'wire-placement' | 'wire-removal'
      title: string
      description: string
      status: string
    }> = []

    // Add bracket events
    brackets.forEach(bracket => {
      if (bracket.placementDate) {
        events.push({
          id: `bracket-place-${bracket.id}`,
          date: bracket.placementDate,
          type: 'bracket-placement',
          title: `Τοποθέτηση bracket δοντιού ${bracket.toothPosition}`,
          description: `${bracket.type} bracket, slot ${bracket.slot}"`,
          status: bracket.status
        })
      }
      if (bracket.removalDate) {
        events.push({
          id: `bracket-remove-${bracket.id}`,
          date: bracket.removalDate,
          type: 'bracket-removal',
          title: `Αφαίρεση bracket δοντιού ${bracket.toothPosition}`,
          description: `${bracket.type} bracket`,
          status: 'removed'
        })
      }
    })

    // Add wire events
    wires.forEach(wire => {
      events.push({
        id: `wire-place-${wire.id}`,
        date: wire.placementDate,
        type: 'wire-placement',
        title: `Τοποθέτηση wire #${wire.sequence}`,
        description: `${wire.material} ${wire.size}" ${wire.type} - ${wire.arch}`,
        status: wire.status
      })
      if (wire.removalDate) {
        events.push({
          id: `wire-remove-${wire.id}`,
          date: wire.removalDate,
          type: 'wire-removal',
          title: `Αφαίρεση wire #${wire.sequence}`,
          description: `${wire.material} ${wire.size}"`,
          status: 'removed'
        })
      }
    })

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [brackets, wires])

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Κενό timeline
        </h3>
        <p className="text-gray-500">
          Δεν υπάρχουν καταγεγραμμένα γεγονότα θεραπείας
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      
      <div className="space-y-6">
        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative ml-10"
          >
            <div className="absolute -left-8 top-2 w-4 h-4 bg-primary-600 rounded-full border-2 border-white" />
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Bracket Modal Component
interface BracketModalProps {
  bracket: Bracket
  isOpen: boolean
  onClose: () => void
  onSave: (bracket: Bracket) => void
  typeOptions: Array<{ label: string; value: string }>
  statusOptions: Array<{ label: string; value: string }>
  slotOptions: Array<{ label: string; value: string }>
  readonly: boolean
}

const BracketModal: React.FC<BracketModalProps> = ({
  bracket,
  isOpen,
  onClose,
  onSave,
  typeOptions,
  statusOptions,
  slotOptions,
  readonly
}) => {
  const [formData, setFormData] = useState(bracket)

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${bracket.id.startsWith('bracket-') ? 'Νέο' : 'Επεξεργασία'} Bracket`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Αριθμός δοντιού"
            type="number"
            value={formData.toothId}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              toothId: parseInt(e.target.value) || 11,
              toothPosition: e.target.value
            }))}
            disabled={readonly}
          />

          <Dropdown
            label="Τύπος bracket"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as Bracket['type'] }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Μάρκα"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            disabled={readonly}
          />

          <Input
            label="Μέγεθος"
            value={formData.size}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Dropdown
            label="Slot"
            options={slotOptions}
            value={formData.slot}
            onChange={(value) => setFormData(prev => ({ ...prev, slot: value as Bracket['slot'] }))}
            disabled={readonly}
          />

          <Input
            label="Torque (°)"
            type="number"
            value={formData.torque}
            onChange={(e) => setFormData(prev => ({ ...prev, torque: parseInt(e.target.value) || 0 }))}
            disabled={readonly}
          />

          <Input
            label="Angulation (°)"
            type="number"
            value={formData.angulation}
            onChange={(e) => setFormData(prev => ({ ...prev, angulation: parseInt(e.target.value) || 0 }))}
            disabled={readonly}
          />
        </div>

        <Dropdown
          label="Κατάσταση"
          options={statusOptions}
          value={formData.status}
          onChange={(value) => setFormData(prev => ({ ...prev, status: value as Bracket['status'] }))}
          disabled={readonly}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ημερομηνία τοποθέτησης"
            type="date"
            value={formData.placementDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, placementDate: e.target.value }))}
            disabled={readonly}
          />

          <Input
            label="Ημερομηνία αφαίρεσης"
            type="date"
            value={formData.removalDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, removalDate: e.target.value }))}
            disabled={readonly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={readonly}
            placeholder="Προσθέστε σημειώσεις για αυτό το bracket..."
          />
        </div>

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

// Wire Modal Component
interface WireModalProps {
  wire: Wire
  isOpen: boolean
  onClose: () => void
  onSave: (wire: Wire) => void
  materialOptions: Array<{ label: string; value: string }>
  typeOptions: Array<{ label: string; value: string }>
  statusOptions: Array<{ label: string; value: string }>
  readonly: boolean
}

const WireModal: React.FC<WireModalProps> = ({
  wire,
  isOpen,
  onClose,
  onSave,
  materialOptions,
  typeOptions,
  statusOptions,
  readonly
}) => {
  const [formData, setFormData] = useState(wire)

  const archOptions = [
    { label: 'Άνω αψίδα', value: 'upper' },
    { label: 'Κάτω αψίδα', value: 'lower' },
    { label: 'Άνω & Κάτω', value: 'both' }
  ]

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${wire.id.startsWith('wire-') ? 'Νέο' : 'Επεξεργασία'} Wire`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            label="Αψίδα"
            options={archOptions}
            value={formData.arch}
            onChange={(value) => setFormData(prev => ({ ...prev, arch: value as Wire['arch'] }))}
            disabled={readonly}
          />

          <Input
            label="Αλληλουχία"
            type="number"
            value={formData.sequence}
            onChange={(e) => setFormData(prev => ({ ...prev, sequence: parseInt(e.target.value) || 1 }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            label="Υλικό"
            options={materialOptions}
            value={formData.material}
            onChange={(value) => setFormData(prev => ({ ...prev, material: value as Wire['material'] }))}
            disabled={readonly}
          />

          <Dropdown
            label="Τύπος"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as Wire['type'] }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Μέγεθος"
            value={formData.size}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            disabled={readonly}
            placeholder="π.χ. 0.012, 0.016x0.022"
          />

          <Dropdown
            label="Κατάσταση"
            options={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as Wire['status'] }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ημερομηνία τοποθέτησης"
            type="date"
            value={formData.placementDate}
            onChange={(e) => setFormData(prev => ({ ...prev, placementDate: e.target.value }))}
            disabled={readonly}
          />

          <Input
            label="Ημερομηνία αφαίρεσης"
            type="date"
            value={formData.removalDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, removalDate: e.target.value }))}
            disabled={readonly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={readonly}
            placeholder="Προσθέστε σημειώσεις για αυτό το wire..."
          />
        </div>

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

export default BracketManager
export type { Bracket, Wire, Adjustment, Complication }