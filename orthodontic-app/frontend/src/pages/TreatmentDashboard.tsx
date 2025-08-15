/**
 * Treatment Dashboard Component for Orthodontic App
 * Location: frontend/src/pages/TreatmentDashboard.tsx
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  PhotoIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  TrendingUpIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Dropdown from '@components/common/Dropdown'
import ToothChart from '@components/orthodontic/ToothChart'
import TreatmentPlan from '@components/orthodontic/TreatmentPlan'
import ProgressTracker from '@components/orthodontic/ProgressTracker'
import ClinicalNotes from '@components/orthodontic/ClinicalNotes'
import PhotoGallery from '@components/photos/PhotoGallery'

// Types
interface Patient {
  id: string
  name: string
  dateOfBirth: string
  phone: string
  email: string
  treatmentStart?: string
  treatmentEstimatedEnd?: string
  currentPhase?: string
  totalCost?: number
  paidAmount?: number
}

interface TreatmentStats {
  totalPatients: number
  activePatients: number
  completedTreatments: number
  averageDuration: number // months
  totalRevenue: number
  pendingPayments: number
  upcomingAppointments: number
  overdueAppointments: number
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  color: string
}

interface TreatmentDashboardProps {
  patientId?: string
  patient?: Patient
  stats?: TreatmentStats
  onPatientChange?: (patientId: string) => void
  className?: string
}

const TreatmentDashboard: React.FC<TreatmentDashboardProps> = ({
  patientId,
  patient,
  stats,
  onPatientChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'progress' | 'notes' | 'photos'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  // Mock data - in real app this would come from API
  const mockStats: TreatmentStats = stats || {
    totalPatients: 156,
    activePatients: 89,
    completedTreatments: 45,
    averageDuration: 18,
    totalRevenue: 125420,
    pendingPayments: 12350,
    upcomingAppointments: 23,
    overdueAppointments: 3
  }

  const mockPatient: Patient = patient || {
    id: 'patient-1',
    name: 'Μαρία Παπαδοπούλου',
    dateOfBirth: '1995-03-15',
    phone: '210-123-4567',
    email: 'maria@example.com',
    treatmentStart: '2024-01-15',
    treatmentEstimatedEnd: '2025-07-15',
    currentPhase: 'Ενεργή θεραπεία - Φάση 2',
    totalCost: 3500,
    paidAmount: 2100
  }

  // Calculate treatment progress
  const treatmentProgress = useMemo(() => {
    if (!mockPatient.treatmentStart || !mockPatient.treatmentEstimatedEnd) return 0
    
    const start = new Date(mockPatient.treatmentStart)
    const end = new Date(mockPatient.treatmentEstimatedEnd)
    const now = new Date()
    
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [mockPatient.treatmentStart, mockPatient.treatmentEstimatedEnd])

  // Payment progress
  const paymentProgress = useMemo(() => {
    if (!mockPatient.totalCost || !mockPatient.paidAmount) return 0
    return (mockPatient.paidAmount / mockPatient.totalCost) * 100
  }, [mockPatient.totalCost, mockPatient.paidAmount])

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-appointment',
      label: 'Νέο ραντεβού',
      icon: <CalendarDaysIcon className="h-5 w-5" />,
      action: () => console.log('New appointment'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'take-photo',
      label: 'Λήψη φωτογραφίας',
      icon: <PhotoIcon className="h-5 w-5" />,
      action: () => console.log('Take photo'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'add-note',
      label: 'Νέα σημείωση',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      action: () => console.log('Add note'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'add-payment',
      label: 'Καταγραφή πληρωμής',
      icon: <CurrencyEuroIcon className="h-5 w-5" />,
      action: () => console.log('Add payment'),
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }
  ]

  // Period options
  const periodOptions = [
    { label: 'Τελευταία εβδομάδα', value: 'week' },
    { label: 'Τελευταίος μήνας', value: 'month' },
    { label: 'Τελευταίο τρίμηνο', value: 'quarter' },
    { label: 'Τελευταίος χρόνος', value: 'year' }
  ]

  // Tab options
  const tabs = [
    { id: 'overview', label: 'Επισκόπηση', icon: ChartBarIcon },
    { id: 'plan', label: 'Σχέδιο θεραπείας', icon: DocumentTextIcon },
    { id: 'progress', label: 'Πρόοδος', icon: TrendingUpIcon },
    { id: 'notes', label: 'Σημειώσεις', icon: DocumentTextIcon },
    { id: 'photos', label: 'Φωτογραφίες', icon: PhotoIcon }
  ]

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
      month: 'long',
      year: 'numeric'
    })
  }

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Θεραπευτικό Dashboard</h1>
            <p className="text-gray-600">
              {patientId ? `Ασθενής: ${mockPatient.name}` : 'Γενική επισκόπηση θεραπειών'}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Dropdown
              options={periodOptions}
              value={selectedPeriod}
              onChange={(value) => setSelectedPeriod(value as any)}
              size="sm"
            />
            
            {patientId && (
              <Button size="sm" variant="outline">
                Αλλαγή ασθενή
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardBody padding="sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {patientId ? 'Ηλικία ασθενή' : 'Ενεργοί ασθενείς'}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {patientId ? `${calculateAge(mockPatient.dateOfBirth)} ετών` : mockStats.activePatients}
                    </p>
                    {!patientId && (
                      <p className="text-xs text-gray-600">
                        από {mockStats.totalPatients} συνολικά
                      </p>