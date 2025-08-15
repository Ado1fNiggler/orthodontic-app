/**
 * Financial Dashboard Page for Orthodontic App
 * Location: frontend/src/pages/FinancialDashboard.tsx
 * File #88/90
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CurrencyEuroIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody, StatCard } from '../components/common/Card'
import Button from '../components/common/Button'
import PaymentForm from '../components/financial/PaymentForm'
import PaymentHistory from '../components/financial/PaymentHistory'
import MonthlyReport from '../components/reports/MonthlyReport'

// Types
interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  dailyRevenue: number
  totalPayments: number
  pendingPayments: number
  overduePayments: number
  averagePayment: number
  revenueGrowth: number
  paymentMethods: {
    cash: number
    card: number
    transfer: number
    other: number
  }
  topPatients: Array<{
    id: string
    name: string
    totalPaid: number
    paymentsCount: number
  }>
}

interface Payment {
  id: string
  patientId: string
  patientName: string
  amount: number
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'INSURANCE' | 'OTHER'
  date: string
  description?: string
  receiptNumber?: string
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  category: 'treatment' | 'consultation' | 'equipment' | 'other'
  createdAt: string
}

interface ChartData {
  labels: string[]
  revenue: number[]
  payments: number[]
}

const FinancialDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 45250.00,
    monthlyRevenue: 8750.00,
    dailyRevenue: 425.00,
    totalPayments: 156,
    pendingPayments: 12,
    overduePayments: 3,
    averagePayment: 290.00,
    revenueGrowth: 12.5,
    paymentMethods: {
      cash: 35,
      card: 45,
      transfer: 15,
      other: 5
    },
    topPatients: [
      { id: '1', name: 'Μαρία Παπαδοπούλου', totalPaid: 2850.00, paymentsCount: 8 },
      { id: '2', name: 'Γιάννης Κωνσταντίνου', totalPaid: 2400.00, paymentsCount: 6 },
      { id: '3', name: 'Ελένη Γεωργίου', totalPaid: 2150.00, paymentsCount: 7 }
    ]
  })

  const [chartData, setChartData] = useState<ChartData>({
    labels: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν'],
    revenue: [7200, 8100, 7800, 8900, 8400, 8750],
    payments: [25, 28, 27, 31, 29, 30]
  })

  const [recentPayments, setRecentPayments] = useState<Payment[]>([
    {
      id: '1',
      patientId: 'p1',
      patientName: 'Μαρία Παπαδοπούλου',
      amount: 350.00,
      method: 'CARD',
      date: '2024-08-14',
      description: 'Πληρωμή φάσης 2',
      receiptNumber: '2024-001',
      status: 'PAID',
      category: 'treatment',
      createdAt: '2024-08-14T10:30:00Z'
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Γιάννης Κωνσταντίνου',
      amount: 150.00,
      method: 'CASH',
      date: '2024-08-13',
      description: 'Συμβουλευτική επίσκεψη',
      status: 'PAID',
      category: 'consultation',
      createdAt: '2024-08-13T15:45:00Z'
    }
  ])

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [loading, setLoading] = useState(false)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Handle period change
  const handlePeriodChange = (period: typeof selectedPeriod) => {
    setSelectedPeriod(period)
    // Here you would fetch data for the selected period
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  // Handle payment save
  const handlePaymentSave = (payment: any) => {
    console.log('New payment:', payment)
    // Here you would save the payment and refresh data
    setShowPaymentForm(false)
  }

  // Calculate trends
  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUpIcon className="h-4 w-4 text-success-600" />
    } else if (growth < 0) {
      return <TrendingDownIcon className="h-4 w-4 text-error-600" />
    }
    return <ClockIcon className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-success-600'
    if (growth < 0) return 'text-error-600'
    return 'text-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Οικονομική Διαχείριση</h1>
          <p className="text-gray-600">Παρακολούθηση εσόδων και πληρωμών</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Period Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'today', label: 'Σήμερα' },
              { key: 'week', label: 'Εβδομάδα' },
              { key: 'month', label: 'Μήνας' },
              { key: 'year', label: 'Έτος' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => handlePeriodChange(period.key as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <Button
            variant="secondary"
            onClick={() => setShowReports(true)}
            leftIcon={<ChartBarIcon />}
          >
            Αναφορές
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowPaymentForm(true)}
            leftIcon={<PlusIcon />}
          >
            Νέα πληρωμή
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Συνολικά έσοδα"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${selectedPeriod === 'month' ? 'Τρέχων μήνας' : 'Σύνολο'}`}
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
          trend={{
            value: stats.revenueGrowth,
            direction: stats.revenueGrowth > 0 ? 'up' : 'down',
            label: 'vs προηγ. περίοδο'
          }}
          color="primary"
          loading={loading}
        />
        
        <StatCard
          title="Πληρωμές"
          value={stats.totalPayments}
          subtitle={`Μέσος όρος: ${formatCurrency(stats.averagePayment)}`}
          icon={<ChartBarIcon className="h-5 w-5" />}
          color="success"
          loading={loading}
        />
        
        <StatCard
          title="Εκκρεμείς"
          value={stats.pendingPayments}
          subtitle="Πληρωμές"
          icon={<ClockIcon className="h-5 w-5" />}
          color="warning"
          loading={loading}
        />
        
        <StatCard
          title="Εκπρόθεσμες"
          value={stats.overduePayments}
          subtitle="Χρειάζονται προσοχή"
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          color="error"
          loading={loading}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader title="Έσοδα ανά μήνα" />
          <CardBody>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              {/* Here you would integrate a charting library like Chart.js or Recharts */}
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Γράφημα εσόδων</p>
                <p className="text-sm text-gray-400">
                  Εσοδα τελευταίων 6 μηνών: {formatCurrency(chartData.revenue.reduce((a, b) => a + b, 0))}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader title="Τρόποι πληρωμής" />
          <CardBody>
            <div className="space-y-4">
              {Object.entries(stats.paymentMethods).map(([method, percentage]) => {
                const methodLabels = {
                  cash: 'Μετρητά',
                  card: 'Κάρτα',
                  transfer: 'Μεταφορά',
                  other: 'Άλλο'
                }
                
                return (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {methodLabels[method as keyof typeof methodLabels]}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Patients and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Paying Patients */}
        <Card>
          <CardHeader title="Κορυφαίοι ασθενείς" />
          <CardBody>
            <div className="space-y-4">
              {stats.topPatients.map((patient, index) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.paymentsCount} πληρωμές</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(patient.totalPaid)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Γρήγορες ενέργειες" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentForm(true)}
                leftIcon={<PlusIcon />}
                fullWidth
              >
                Νέα πληρωμή
              </Button>
              
              <Button
                variant="outline"
                leftIcon={<ChartBarIcon />}
                fullWidth
              >
                Αναλυτική αναφορά
              </Button>
              
              <Button
                variant="outline"
                leftIcon={<ArrowDownTrayIcon />}
                fullWidth
              >
                Εξαγωγή δεδομένων
              </Button>
              
              <Button
                variant="outline"
                leftIcon={<Cog6ToothIcon />}
                fullWidth
              >
                Ρυθμίσεις
              </Button>
            </div>
            
            {/* Recent Alerts */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Ειδοποιήσεις</h4>
              
              {stats.overduePayments > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-error-50 text-error-700 rounded-lg">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {stats.overduePayments} εκπρόθεσμες πληρωμές
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 p-3 bg-success-50 text-success-700 rounded-lg">
                <TrendingUpIcon className="h-4 w-4" />
                <span className="text-sm">
                  Αύξηση εσόδων {stats.revenueGrowth}% αυτόν τον μήνα
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader 
          title="Πρόσφατες πληρωμές"
          extra={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<EyeIcon />}
            >
              Προβολή όλων
            </Button>
          }
        />
        <CardBody padding="none">
          <PaymentHistory
            payments={recentPayments}
            onPaymentEdit={(payment) => console.log('Edit payment:', payment)}
            onPaymentDelete={(id) => console.log('Delete payment:', id)}
            className="border-0 shadow-none"
          />
        </CardBody>
      </Card>

      {/* Modals */}
      {showPaymentForm && (
        <PaymentForm
          patientId=""
          patientName="Επιλέξτε ασθενή"
          isOpen={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          onPaymentSave={handlePaymentSave}
        />
      )}

      {showReports && (
        <MonthlyReport
          isOpen={showReports}
          onClose={() => setShowReports(false)}
          month={new Date().getMonth() + 1}
          year={new Date().getFullYear()}
        />
      )}
    </div>
  )
}

export default FinancialDashboard