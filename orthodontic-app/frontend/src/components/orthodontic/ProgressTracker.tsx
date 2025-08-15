/**
 * Progress Tracker Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/ProgressTracker.tsx
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Dropdown from '@components/common/Dropdown'

// Types
interface ProgressMeasurement {
  id: string
  date: string
  visitId?: string
  measurements: {
    overjet: number
    overbite: number
    upperCrowding: number
    lowerCrowding: number
    midlineDeviation: number
    canineClassRight: 'I' | 'II' | 'III'
    canineClassLeft: 'I' | 'II' | 'III'
    molarClassRight: 'I' | 'II' | 'III'
    molarClassLeft: 'I' | 'II' | 'III'
  }
  photos?: string[]
  notes?: string
  phase?: string
  milestones?: string[]
}

interface TreatmentMilestone {
  id: string
  title: string
  description: string
  targetDate: string
  completedDate?: string
  status: 'upcoming' | 'current' | 'completed' | 'overdue'
  importance: 'low' | 'medium' | 'high' | 'critical'
  category: 'diagnostic' | 'preparation' | 'active-treatment' | 'retention' | 'monitoring'
}

interface ProgressGoal {
  id: string
  parameter: keyof ProgressMeasurement['measurements']
  targetValue: number
  currentValue: number
  targetDate: string
  description: string
  achieved: boolean
}

interface ProgressTrackerProps {
  patientId: string
  measurements?: ProgressMeasurement[]
  milestones?: TreatmentMilestone[]
  goals?: ProgressGoal[]
  treatmentStart?: string
  estimatedEnd?: string
  onAddMeasurement?: () => void
  onAddMilestone?: () => void
  readonly?: boolean
  className?: string
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  patientId,
  measurements = [],
  milestones = [],
  goals = [],
  treatmentStart,
  estimatedEnd,
  onAddMeasurement,
  onAddMilestone,
  readonly = false,
  className
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '1y' | 'all'>('6m')
  const [selectedParameter, setSelectedParameter] = useState<keyof ProgressMeasurement['measurements'] | 'overview'>('overview')
  const [viewMode, setViewMode] = useState<'chart' | 'milestones' | 'goals'>('chart')

  // Filter measurements by timeframe
  const filteredMeasurements = useMemo(() => {
    if (selectedTimeframe === 'all') return measurements

    const cutoffDate = new Date()
    switch (selectedTimeframe) {
      case '3m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3)
        break
      case '6m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
        break
    }

    return measurements.filter(m => new Date(m.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [measurements, selectedTimeframe])

  // Calculate treatment progress
  const treatmentProgress = useMemo(() => {
    if (!treatmentStart || !estimatedEnd) return null

    const start = new Date(treatmentStart)
    const end = new Date(estimatedEnd)
    const now = new Date()
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()

    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [treatmentStart, estimatedEnd])

  // Calculate parameter trends
  const parameterTrends = useMemo(() => {
    if (filteredMeasurements.length < 2) return {}

    const trends: Record<string, { change: number; trend: 'up' | 'down' | 'stable' }> = {}
    const latest = filteredMeasurements[filteredMeasurements.length - 1]
    const previous = filteredMeasurements[filteredMeasurements.length - 2]

    Object.keys(latest.measurements).forEach(key => {
      if (typeof latest.measurements[key as keyof typeof latest.measurements] === 'number') {
        const currentValue = latest.measurements[key as keyof typeof latest.measurements] as number
        const previousValue = previous.measurements[key as keyof typeof previous.measurements] as number
        const change = currentValue - previousValue

        trends[key] = {
          change: Math.abs(change),
          trend: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable'
        }
      }
    })

    return trends
  }, [filteredMeasurements])

  // Options
  const timeframeOptions = [
    { label: 'Τελευταίοι 3 μήνες', value: '3m' },
    { label: 'Τελευταίοι 6 μήνες', value: '6m' },
    { label: 'Τελευταίος χρόνος', value: '1y' },
    { label: 'Όλη η θεραπεία', value: 'all' }
  ]

  const parameterOptions = [
    { label: 'Επισκόπηση', value: 'overview' },
    { label: 'Overjet', value: 'overjet' },
    { label: 'Overbite', value: 'overbite' },
    { label: 'Συνωστισμός άνω', value: 'upperCrowding' },
    { label: 'Συνωστισμός κάτω', value: 'lowerCrowding' },
    { label: 'Μεσ. γραμμή', value: 'midlineDeviation' }
  ]

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get milestone status color
  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'current': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'upcoming': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUpIcon className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDownIcon className="h-4 w-4 text-green-500" />
      default: return <div className="h-4 w-4" />
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Παρακολούθηση Προόδου"
          extra={
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {['chart', 'milestones', 'goals'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {mode === 'chart' && 'Γραφήματα'}
                    {mode === 'milestones' && 'Ορόσημα'}
                    {mode === 'goals' && 'Στόχοι'}
                  </button>
                ))}
              </div>

              {!readonly && (
                <div className="flex space-x-2">
                  {viewMode === 'chart' && onAddMeasurement && (
                    <Button size="sm" onClick={onAddMeasurement}>
                      Νέα μέτρηση
                    </Button>
                  )}
                  {viewMode === 'milestones' && onAddMilestone && (
                    <Button size="sm" onClick={onAddMilestone}>
                      Νέο ορόσημο
                    </Button>
                  )}
                </div>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-6">
            {/* Treatment Progress Bar */}
            {treatmentProgress !== null && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Πρόοδος θεραπείας</h3>
                  <span className="text-sm text-gray-600">{Math.round(treatmentProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${treatmentProgress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Έναρξη: {treatmentStart && formatDate(treatmentStart)}</span>
                  <span>Εκτιμώμενη λήξη: {estimatedEnd && formatDate(estimatedEnd)}</span>
                </div>
              </div>
            )}

            {/* View Content */}
            {viewMode === 'chart' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <Dropdown
                    options={timeframeOptions}
                    value={selectedTimeframe}
                    onChange={(value) => setSelectedTimeframe(value as any)}
                    size="sm"
                  />
                  
                  <Dropdown
                    options={parameterOptions}
                    value={selectedParameter}
                    onChange={(value) => setSelectedParameter(value as any)}
                    size="sm"
                  />
                </div>

                {/* Overview Cards */}
                {selectedParameter === 'overview' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'overjet', label: 'Overjet', unit: 'mm' },
                      { key: 'overbite', label: 'Overbite', unit: '%' },
                      { key: 'upperCrowding', label: 'Συνωστ. άνω', unit: 'mm' },
                      { key: 'lowerCrowding', label: 'Συνωστ. κάτω', unit: 'mm' },
                      { key: 'midlineDeviation', label: 'Μεσ. γραμμή', unit: 'mm' }
                    ].map(({ key, label, unit }) => {
                      const latest = filteredMeasurements[filteredMeasurements.length - 1]
                      const trend = parameterTrends[key]
                      const value = latest?.measurements[key as keyof typeof latest.measurements] as number

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-600">{label}</h4>
                            {trend && getTrendIcon(trend.trend)}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {value !== undefined ? `${value}${unit}` : 'N/A'}
                          </div>
                          {trend && trend.change > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {trend.trend === 'up' ? '+' : trend.trend === 'down' ? '-' : '±'}{trend.change.toFixed(1)}{unit}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Measurement History */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ιστορικό μετρήσεων</h3>
                  
                  {filteredMeasurements.length === 0 ? (
                    <div className="text-center py-12">
                      <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Δεν υπάρχουν μετρήσεις
                      </h4>
                      <p className="text-gray-500 mb-4">
                        Προσθέστε μετρήσεις για να παρακολουθήσετε την πρόοδο
                      </p>
                      {!readonly && onAddMeasurement && (
                        <Button onClick={onAddMeasurement}>
                          Προσθήκη πρώτης μέτρησης
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMeasurements.map((measurement, index) => (
                        <motion.div
                          key={measurement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Μέτρηση {formatDate(measurement.date)}
                              </h4>
                              {measurement.phase && (
                                <span className="text-sm text-gray-500">
                                  Φάση: {measurement.phase}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {measurement.photos && measurement.photos.length > 0 && (
                                <span className="flex items-center text-xs text-gray-500">
                                  <PhotoIcon className="h-3 w-3 mr-1" />
                                  {measurement.photos.length}
                                </span>
                              )}
                              {measurement.notes && (
                                <span className="flex items-center text-xs text-gray-500">
                                  <DocumentTextIcon className="h-3 w-3 mr-1" />
                                  Σημειώσεις
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Overjet:</span>
                              <span className="ml-1 font-medium">{measurement.measurements.overjet}mm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Overbite:</span>
                              <span className="ml-1 font-medium">{measurement.measurements.overbite}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Συνωστ. άνω:</span>
                              <span className="ml-1 font-medium">{measurement.measurements.upperCrowding}mm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Συνωστ. κάτω:</span>
                              <span className="ml-1 font-medium">{measurement.measurements.lowerCrowding}mm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Μεσ. γραμμή:</span>
                              <span className="ml-1 font-medium">{measurement.measurements.midlineDeviation}mm</span>
                            </div>
                          </div>

                          {measurement.milestones && measurement.milestones.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap gap-1">
                                {measurement.milestones.map((milestone, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                                  >
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    {milestone}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {measurement.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-600">{measurement.notes}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'milestones' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {milestones.filter(m => m.status === 'completed').length}
                    </div>
                    <div className="text-xs text-blue-600">Ολοκληρωμένα</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {milestones.filter(m => m.status === 'current').length}
                    </div>
                    <div className="text-xs text-green-600">Τρέχοντα</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-yellow-600">
                      {milestones.filter(m => m.status === 'upcoming').length}
                    </div>
                    <div className="text-xs text-yellow-600">Επερχόμενα</div>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {milestones.filter(m => m.status === 'overdue').length}
                    </div>
                    <div className="text-xs text-red-600">Καθυστερημένα</div>
                  </div>
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDaysIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Δεν υπάρχουν ορόσημα
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Ορίστε ορόσημα για να παρακολουθήσετε την πρόοδο της θεραπείας
                    </p>
                    {!readonly && onAddMilestone && (
                      <Button onClick={onAddMilestone}>
                        Προσθήκη πρώτου οροσήμου
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones
                      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
                      .map((milestone, index) => (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImportanceColor(milestone.importance)}`}>
                                {milestone.importance}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMilestoneStatusColor(milestone.status)}`}>
                                {milestone.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                Στόχος: {formatDate(milestone.targetDate)}
                              </span>
                              {milestone.completedDate && (
                                <span className="flex items-center text-green-600">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Ολοκληρώθηκε: {formatDate(milestone.completedDate)}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {milestone.category}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'goals' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {goals.filter(g => g.achieved).length}
                    </div>
                    <div className="text-xs text-green-600">Επιτευχθέντες</div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {goals.filter(g => !g.achieved && new Date(g.targetDate) >= new Date()).length}
                    </div>
                    <div className="text-xs text-blue-600">Ενεργοί</div>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {goals.filter(g => !g.achieved && new Date(g.targetDate) < new Date()).length}
                    </div>
                    <div className="text-xs text-red-600">Καθυστερημένοι</div>
                  </div>
                </div>

                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <InformationCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Δεν υπάρχουν στόχοι
                    </h4>
                    <p className="text-gray-500">
                      Ορίστε στόχους για τις παραμέτρους της θεραπείας
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal, index) => {
                      const progress = Math.min(100, Math.max(0, 
                        ((goal.targetValue - Math.abs(goal.currentValue - goal.targetValue)) / goal.targetValue) * 100
                      ))
                      const isOverdue = !goal.achieved && new Date(goal.targetDate) < new Date()

                      return (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border rounded-lg p-4 ${
                            goal.achieved 
                              ? 'border-green-200 bg-green-50' 
                              : isOverdue 
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 flex items-center">
                                {goal.description}
                                {goal.achieved && (
                                  <CheckCircleIcon className="h-5 w-5 ml-2 text-green-500" />
                                )}
                                {isOverdue && (
                                  <ExclamationCircleIcon className="h-5 w-5 ml-2 text-red-500" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Στόχος: {goal.targetValue} | Τρέχουσα τιμή: {goal.currentValue}
                              </p>
                            </div>

                            <span className="text-sm text-gray-500">
                              Έως: {formatDate(goal.targetDate)}
                            </span>
                          </div>

                          {!goal.achieved && (
                            <div className="mb-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Πρόοδος προς στόχο</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    goal.achieved 
                                      ? 'bg-green-500' 
                                      : progress > 75 
                                        ? 'bg-blue-500'
                                        : progress > 50 
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ProgressTracker
export type { ProgressMeasurement, TreatmentMilestone, ProgressGoal }