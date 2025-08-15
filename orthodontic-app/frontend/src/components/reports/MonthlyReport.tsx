/**
 * Monthly Report Component for Orthodontic App
 * Location: frontend/src/components/reports/MonthlyReport.tsx
 * File #89/90
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody, StatCard } from '../common/Card'
import Button from '../common/Button'
import Modal from '../common/Modal'

// Types
interface MonthlyReportData {
  month: number
  year: number
  totalRevenue: number
  totalPayments: number
  totalPatients: number
  newPatients: number
  completedTreatments: number
  activeInstallmentPlans: number
  averagePayment: number
  revenueGrowth: number
  paymentsByMethod: {
    cash: number
    card: number
    bankTransfer: number
    check: number
    insurance: number
    other: number
  }
  paymentsByStatus: {
    paid: number
    pending: number
    overdue: number
    cancelled: number
    refunded: number
  }
  paymentsByCategory: {
    treatment: number
    consultation: number
    equipment: number
    other: number
  }
  dailyRevenue: Array<{
    date: string
    revenue: number
    payments: number
  }>
  topPatients: Array<{
    id: string
    name: string
    totalPaid: number
    paymentsCount: number
  }>
  treatmentStats: {
    consultations: number
    activePhases: number
    completedPhases: number
    followUps: number
  }
}

interface MonthlyReportProps {
  isOpen: boolean
  onClose: () => void
  month: number
  year: number
  onMonthChange?: (month: number, year: number) => void
  className?: string
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  isOpen,
  onClose,
  month,
  year,
  onMonthChange,
  className
}) => {
  const [reportData, setReportData] = useState<MonthlyReportData>({
    month,
    year,
    totalRevenue: 12450.00,
    totalPayments: 48,
    totalPatients: 35,
    newPatients: 8,
    completedTreatments: 5,
    activeInstallmentPlans: 12,
    averagePayment: 259.38,
    revenueGrowth: 15.2,
    paymentsByMethod: {
      cash: 18,
      card: 22,
      bankTransfer: 6,
      check: 1,
      insurance: 1,
      other: 0
    },
    paymentsByStatus: {
      paid: 42,
      pending: 4,
      overdue: 2,
      cancelled: 0,
      refunded: 0
    },
    paymentsByCategory: {
      treatment: 35,
      consultation: 8,
      equipment: 3,
      other: 2
    },
    dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
      date: `2024-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`,
      revenue: Math.random() * 800 + 200,
      payments: Math.floor(Math.random() * 5) + 1
    })),
    topPatients: [
      { id: '1', name: 'Μαρία Παπαδοπούλου', totalPaid: 1250.00, paymentsCount: 5 },
      { id: '2', name: 'Γιάννης Κωνσταντίνου', totalPaid: 980.00, paymentsCount: 3 },
      { id: '3', name: 'Ελένη Γεωργίου', totalPaid: 850.00, paymentsCount: 4 },
      { id: '4', name: 'Δημήτρης Αντωνίου', totalPaid: 720.00, paymentsCount: 2 },
      { id: '5', name: 'Σοφία Νικολάου', totalPaid: 650.00, paymentsCount: 3 }
    ],
    treatmentStats: {
      consultations: 15,
      activePhases: 28,
      completedPhases: 12,
      followUps: 8
    }
  })

  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'payments' | 'patients' | 'treatments'>('overview')

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  // Get month name
  const getMonthName = (monthNum: number) => {
    const months = [
      'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
      'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
    ]
    return months[monthNum - 1]
  }

  // Handle month/year change
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setReportData(prev => ({ ...prev, month: newMonth, year: newYear }))
      setLoading(false)
      onMonthChange?.(newMonth, newYear)
    }, 1000)
  }

  // Handle export
  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`)
    // Implementation would integrate with PDF/Excel generation
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Calculate comparison with previous month
  const previousMonthRevenue = reportData.totalRevenue / (1 + reportData.revenueGrowth / 100)
  const revenueChange = reportData.totalRevenue - previousMonthRevenue

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Μηνιαία αναφορά - ${getMonthName(reportData.month)} ${reportData.year}`}
      size="2xl"
      className={className}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Month/Year Selector */}
            <div className="flex items-center space-x-2">
              <select
                value={reportData.month}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value), reportData.year)}
                className="form-select text-sm"
                disabled={loading}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
              
              <select
                value={reportData.year}
                onChange={(e) => handlePeriodChange(reportData.month, parseInt(e.target.value))}
                className="form-select text-sm"
                disabled={loading}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2020 + i} value={2020 + i}>
                    {2020 + i}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Επισκόπηση', icon: <ChartBarIcon className="h-4 w-4" /> },
                { key: 'payments', label: 'Πληρωμές', icon: <CurrencyEuroIcon className="h-4 w-4" /> },
                { key: 'patients', label: 'Ασθενείς', icon: <UserGroupIcon className="h-4 w-4" /> },
                { key: 'treatments', label: 'Θεραπείες', icon: <DocumentTextIcon className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              leftIcon={<ArrowDownTrayIcon />}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              leftIcon={<DocumentTextIcon />}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<PrinterIcon />}
            >
              Εκτύπωση
            </Button>
          </div>
        </div>

        {/* Content based on selected tab */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Φόρτωση δεδομένων...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Συνολικά έσοδα"
                      value={formatCurrency(reportData.totalRevenue)}
                      icon={<CurrencyEuroIcon className="h-5 w-5" />}
                      trend={{
                        value: reportData.revenueGrowth,
                        direction: reportData.revenueGrowth > 0 ? 'up' : 'down',
                        label: 'vs προηγ. μήνα'
                      }}
                      color="primary"
                    />
                    
                    <StatCard
                      title="Πληρωμές"
                      value={reportData.totalPayments}
                      subtitle={`Μ.Ο: ${formatCurrency(reportData.averagePayment)}`}
                      icon={<DocumentTextIcon className="h-5 w-5" />}
                      color="success"
                    />
                    
                    <StatCard
                      title="Ασθενείς"
                      value={reportData.totalPatients}
                      subtitle={`+${reportData.newPatients} νέοι`}
                      icon={<UserGroupIcon className="h-5 w-5" />}
                      color="primary"
                    />
                    
                    <StatCard
                      title="Ολοκληρώσεις"
                      value={reportData.completedTreatments}
                      subtitle="Θεραπείες"
                      icon={<CheckCircleIcon className="h-5 w-5" />}
                      color="success"
                    />
                  </div>

                  {/* Revenue Comparison */}
                  <Card>
                    <CardHeader title="Σύγκριση εσόδων" />
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(reportData.totalRevenue)}
                          </div>
                          <div className="text-sm text-gray-500">Τρέχων μήνας</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {formatCurrency(previousMonthRevenue)}
                          </div>
                          <div className="text-sm text-gray-500">Προηγούμενος μήνας</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-2xl font-bold flex items-center justify-center space-x-2 ${
                            revenueChange > 0 ? 'text-success-600' : 'text-error-600'
                          }`}>
                            {revenueChange > 0 ? (
                              <TrendingUpIcon className="h-6 w-6" />
                            ) : (
                              <TrendingDownIcon className="h-6 w-6" />
                            )}
                            <span>{formatCurrency(Math.abs(revenueChange))}</span>
                          </div>
                          <div className="text-sm text-gray-500">Διαφορά</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Daily Revenue Chart Placeholder */}
                  <Card>
                    <CardHeader title="Ημερήσια έσοδα" />
                    <CardBody>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Γράφημα ημερήσιων εσόδων</p>
                          <p className="text-sm text-gray-400">
                            Μέσος όρος: {formatCurrency(reportData.totalRevenue / 30)} / ημέρα
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Payments Tab */}
              {selectedTab === 'payments' && (
                <div className="space-y-6">
                  {/* Payment Status Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader title="Κατάσταση πληρωμών" />
                      <CardBody>
                        <div className="space-y-4">
                          {Object.entries(reportData.paymentsByStatus).map(([status, count]) => {
                            const statusConfig = {
                              paid: { label: 'Πληρωμένες', color: 'text-success-600', bg: 'bg-success-100' },
                              pending: { label: 'Εκκρεμείς', color: 'text-warning-600', bg: 'bg-warning-100' },
                              overdue: { label: 'Εκπρόθεσμες', color: 'text-error-600', bg: 'bg-error-100' },
                              cancelled: { label: 'Ακυρωμένες', color: 'text-gray-600', bg: 'bg-gray-100' },
                              refunded: { label: 'Επιστράφηκες', color: 'text-purple-600', bg: 'bg-purple-100' }
                            }[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-100' }

                            const percentage = formatPercentage(count, reportData.totalPayments)

                            return (
                              <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${statusConfig.bg}`} />
                                  <span className="text-sm font-medium">{statusConfig.label}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">{count}</span>
                                  <span className="text-xs text-gray-500">({percentage}%)</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader title="Τρόποι πληρωμής" />
                      <CardBody>
                        <div className="space-y-4">
                          {Object.entries(reportData.paymentsByMethod).map(([method, count]) => {
                            const methodLabels = {
                              cash: 'Μετρητά',
                              card: 'Κάρτα',
                              bankTransfer: 'Μεταφορά',
                              check: 'Επιταγή',
                              insurance: 'Ασφάλεια',
                              other: 'Άλλο'
                            }

                            const percentage = formatPercentage(count, reportData.totalPayments)

                            return (
                              <div key={method} className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {methodLabels[method as keyof typeof methodLabels]}
                                </span>
                                <div className="flex items-center space-x-3">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 h-2 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 w-12">{count}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Payment Categories */}
                  <Card>
                    <CardHeader title="Κατηγορίες πληρωμών" />
                    <CardBody>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(reportData.paymentsByCategory).map(([category, count]) => {
                          const categoryLabels = {
                            treatment: 'Θεραπεία',
                            consultation: 'Συμβουλευτική',
                            equipment: 'Εξοπλισμός',
                            other: 'Άλλο'
                          }

                          return (
                            <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-primary-600">{count}</div>
                              <div className="text-sm text-gray-600">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatPercentage(count, reportData.totalPayments)}%
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Patients Tab */}
              {selectedTab === 'patients' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Κορυφαίοι ασθενείς του μήνα" />
                    <CardBody>
                      <div className="space-y-4">
                        {reportData.topPatients.map((patient, index) => (
                          <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-500' : 'bg-primary-500'
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
                              <p className="text-sm text-gray-500">
                                Μ.Ο: {formatCurrency(patient.totalPaid / patient.paymentsCount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                      title="Σύνολο ασθενών"
                      value={reportData.totalPatients}
                      icon={<UserGroupIcon className="h-5 w-5" />}
                      color="primary"
                    />
                    
                    <StatCard
                      title="Νέοι ασθενείς"
                      value={reportData.newPatients}
                      icon={<UserGroupIcon className="h-5 w-5" />}
                      color="success"
                    />
                  </div>
                </div>
              )}

              {/* Treatments Tab */}
              {selectedTab === 'treatments' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Συμβουλευτικές"
                      value={reportData.treatmentStats.consultations}
                      icon={<DocumentTextIcon className="h-5 w-5" />}
                      color="primary"
                    />
                    
                    <StatCard
                      title="Ενεργές φάσεις"
                      value={reportData.treatmentStats.activePhases}
                      icon={<ClockIcon className="h-5 w-5" />}
                      color="warning"
                    />
                    
                    <StatCard
                      title="Ολοκληρωμένες"
                      value={reportData.treatmentStats.completedPhases}
                      icon={<CheckCircleIcon className="h-5 w-5" />}
                      color="success"
                    />
                    
                    <StatCard
                      title="Follow-ups"
                      value={reportData.treatmentStats.followUps}
                      icon={<DocumentTextIcon className="h-5 w-5" />}
                      color="secondary"
                    />
                  </div>

                  <Card>
                    <CardHeader title="Στατιστικά θεραπειών" />
                    <CardBody>
                      <div className="text-center py-12">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Λεπτομερή στατιστικά θεραπειών</p>
                        <p className="text-sm text-gray-400">
                          Ολοκληρωμένες θεραπείες: {reportData.completedTreatments}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p>Αναφορά δημιουργήθηκε: {new Date().toLocaleString('el-GR')}</p>
            <p>Περίοδος: {getMonthName(reportData.month)} {reportData.year}</p>
          </div>
          
          <Button
            variant="outline"
            onClick={onClose}
          >
            Κλείσιμο
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default MonthlyReport