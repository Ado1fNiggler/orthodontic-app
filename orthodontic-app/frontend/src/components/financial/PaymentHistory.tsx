/**
 * Payment History Component for Orthodontic App
 * Location: frontend/src/components/financial/PaymentHistory.tsx
 * File #85/90
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyEuroIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ReceiptRefundIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody, StatCard } from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

// Types
interface Payment {
  id: string
  patientId: string
  patientName: string
  amount: number
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'INSURANCE' | 'OTHER'
  date: string
  description?: string
  receiptNumber?: string
  notes?: string
  category: 'treatment' | 'consultation' | 'equipment' | 'other'
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  installmentPlanId?: string
  vatRate?: number
  vatAmount?: number
  discount?: number
  discountReason?: string
  treatmentPlanId?: string
  createdAt: string
  updatedAt: string
}

interface PaymentFilters {
  dateFrom?: string
  dateTo?: string
  status?: string
  method?: string
  category?: string
  patientId?: string
  amountMin?: number
  amountMax?: number
}

interface PaymentHistoryProps {
  patientId?: string
  payments?: Payment[]
  onPaymentEdit?: (payment: Payment) => void
  onPaymentDelete?: (paymentId: string) => void
  onPaymentRefund?: (paymentId: string) => void
  className?: string
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  patientId,
  payments = [],
  onPaymentEdit,
  onPaymentDelete,
  onPaymentRefund,
  className
}) => {
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>(payments)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Payment method icons
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <BanknotesIcon className="h-4 w-4" />
      case 'CARD':
        return <CreditCardIcon className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <BanknotesIcon className="h-4 w-4" />
      case 'CHECK':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'INSURANCE':
        return <DocumentTextIcon className="h-4 w-4" />
      default:
        return <CurrencyEuroIcon className="h-4 w-4" />
    }
  }

  // Payment status icons and colors
  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return {
          icon: <CheckCircleIcon className="h-4 w-4" />,
          color: 'text-success-600',
          bg: 'bg-success-100',
          label: 'Πληρωμένη'
        }
      case 'PENDING':
        return {
          icon: <ClockIcon className="h-4 w-4" />,
          color: 'text-warning-600',
          bg: 'bg-warning-100',
          label: 'Εκκρεμεί'
        }
      case 'PARTIAL':
        return {
          icon: <ExclamationCircleIcon className="h-4 w-4" />,
          color: 'text-primary-600',
          bg: 'bg-primary-100',
          label: 'Μερική'
        }
      case 'OVERDUE':
        return {
          icon: <XCircleIcon className="h-4 w-4" />,
          color: 'text-error-600',
          bg: 'bg-error-100',
          label: 'Εκπρόθεσμη'
        }
      case 'CANCELLED':
        return {
          icon: <XCircleIcon className="h-4 w-4" />,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: 'Ακυρωμένη'
        }
      case 'REFUNDED':
        return {
          icon: <ReceiptRefundIcon className="h-4 w-4" />,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          label: 'Επιστράφηκε'
        }
      default:
        return {
          icon: <ClockIcon className="h-4 w-4" />,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: status
        }
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
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Apply filters and search
  useEffect(() => {
    let filtered = [...payments]

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    if (filters.dateFrom) {
      filtered = filtered.filter(payment => payment.date >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(payment => payment.date <= filters.dateTo!)
    }
    if (filters.status) {
      filtered = filtered.filter(payment => payment.status === filters.status)
    }
    if (filters.method) {
      filtered = filtered.filter(payment => payment.method === filters.method)
    }
    if (filters.category) {
      filtered = filtered.filter(payment => payment.category === filters.category)
    }
    if (filters.amountMin) {
      filtered = filtered.filter(payment => payment.amount >= filters.amountMin!)
    }
    if (filters.amountMax) {
      filtered = filtered.filter(payment => payment.amount <= filters.amountMax!)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredPayments(filtered)
  }, [payments, searchQuery, filters, sortBy, sortOrder])

  // Calculate statistics
  const stats = {
    total: filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
    count: filteredPayments.length,
    paid: filteredPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    pending: filteredPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    overdue: filteredPayments.filter(p => p.status === 'OVERDUE').length
  }

  // Handle payment actions
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    onPaymentEdit?.(payment)
  }

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πληρωμή;')) {
      onPaymentDelete?.(paymentId)
    }
  }

  const handleRefundPayment = (paymentId: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να επιστρέψετε αυτή την πληρωμή;')) {
      onPaymentRefund?.(paymentId)
    }
  }

  // Export payments
  const handleExport = (format: 'csv' | 'pdf') => {
    // Implementation would depend on your export utilities
    console.log(`Exporting ${filteredPayments.length} payments as ${format}`)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Συνολικά έσοδα"
          value={formatCurrency(stats.total)}
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
          color="primary"
        />
        <StatCard
          title="Πληρωμές"
          value={stats.count}
          icon={<ReceiptRefundIcon className="h-5 w-5" />}
          color="success"
        />
        <StatCard
          title="Πληρωμένα"
          value={formatCurrency(stats.paid)}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          color="success"
        />
        <StatCard
          title="Εκκρεμή"
          value={formatCurrency(stats.pending)}
          icon={<ClockIcon className="h-5 w-5" />}
          color="warning"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Αναζήτηση πληρωμών..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon />}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<FunnelIcon />}
              >
                Φίλτρα
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                leftIcon={<ArrowDownTrayIcon />}
              >
                Εξαγωγή
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Input
                    label="Από ημερομηνία"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                  
                  <Input
                    label="Έως ημερομηνία"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                  
                  <div>
                    <label className="form-label">Κατάσταση</label>
                    <select
                      className="form-select"
                      value={filters.status || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">Όλες</option>
                      <option value="PAID">Πληρωμένη</option>
                      <option value="PENDING">Εκκρεμεί</option>
                      <option value="PARTIAL">Μερική</option>
                      <option value="OVERDUE">Εκπρόθεσμη</option>
                      <option value="CANCELLED">Ακυρωμένη</option>
                      <option value="REFUNDED">Επιστράφηκε</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Τρόπος πληρωμής</label>
                    <select
                      className="form-select"
                      value={filters.method || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="">Όλοι</option>
                      <option value="CASH">Μετρητά</option>
                      <option value="CARD">Κάρτα</option>
                      <option value="BANK_TRANSFER">Μεταφορά</option>
                      <option value="CHECK">Επιταγή</option>
                      <option value="INSURANCE">Ασφάλεια</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setFilters({})}
                    className="self-end"
                  >
                    Καθαρισμός
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader title="Ιστορικό πληρωμών" />
        <CardBody padding="none">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">
                    <button
                      onClick={() => {
                        setSortBy('date')
                        setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Ημερομηνία</span>
                      <CalendarDaysIcon className="h-3 w-3" />
                    </button>
                  </th>
                  {!patientId && (
                    <th className="table-header-cell">Ασθενής</th>
                  )}
                  <th className="table-header-cell">
                    <button
                      onClick={() => {
                        setSortBy('amount')
                        setSortOrder(sortBy === 'amount' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Ποσό</span>
                      <CurrencyEuroIcon className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="table-header-cell">Τρόπος</th>
                  <th className="table-header-cell">
                    <button
                      onClick={() => {
                        setSortBy('status')
                        setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Κατάσταση</span>
                    </button>
                  </th>
                  <th className="table-header-cell">Περιγραφή</th>
                  <th className="table-header-cell">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="table-body">
                <AnimatePresence>
                  {filteredPayments.map((payment) => {
                    const statusConfig = getPaymentStatusConfig(payment.status)
                    
                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="table-row"
                      >
                        <td className="table-cell">
                          <div className="text-sm">
                            <div className="font-medium">{formatDate(payment.date)}</div>
                            {payment.receiptNumber && (
                              <div className="text-gray-500">#{payment.receiptNumber}</div>
                            )}
                          </div>
                        </td>
                        
                        {!patientId && (
                          <td className="table-cell">
                            <div className="font-medium">{payment.patientName}</div>
                          </td>
                        )}
                        
                        <td className="table-cell">
                          <div className="text-sm">
                            <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                            {payment.discount && payment.discount > 0 && (
                              <div className="text-green-600 text-xs">
                                Έκπτωση: {formatCurrency(payment.discount)}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(payment.method)}
                            <span className="text-sm">
                              {payment.method === 'CASH' ? 'Μετρητά' :
                               payment.method === 'CARD' ? 'Κάρτα' :
                               payment.method === 'BANK_TRANSFER' ? 'Μεταφορά' :
                               payment.method === 'CHECK' ? 'Επιταγή' :
                               payment.method === 'INSURANCE' ? 'Ασφάλεια' : 'Άλλο'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </span>
                        </td>
                        
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {payment.description || '-'}
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayment(payment)}
                              leftIcon={<EyeIcon />}
                            />
                            
                            {onPaymentEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPayment(payment)}
                                leftIcon={<PencilIcon />}
                              />
                            )}
                            
                            {payment.status === 'PAID' && onPaymentRefund && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefundPayment(payment.id)}
                                leftIcon={<ReceiptRefundIcon />}
                              />
                            )}
                            
                            {onPaymentDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePayment(payment.id)}
                                leftIcon={<TrashIcon />}
                                className="text-error-600 hover:text-error-700"
                              />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CurrencyEuroIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Δεν υπάρχουν πληρωμές</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Δεν βρέθηκαν πληρωμές με τα τρέχοντα κριτήρια.'
                  : 'Δεν έχουν καταγραφεί πληρωμές ακόμη.'}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Λεπτομέρειες πληρωμής"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Βασικά στοιχεία</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ημερομηνία:</span>
                    <span className="font-medium">{formatDate(selectedPayment.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ποσό:</span>
                    <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Τρόπος:</span>
                    <span className="font-medium">{selectedPayment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Κατάσταση:</span>
                    <span className={`font-medium ${getPaymentStatusConfig(selectedPayment.status).color}`}>
                      {getPaymentStatusConfig(selectedPayment.status).label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Πρόσθετα στοιχεία</h4>
                <div className="space-y-2 text-sm">
                  {selectedPayment.receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Απόδειξη:</span>
                      <span className="font-medium">{selectedPayment.receiptNumber}</span>
                    </div>
                  )}
                  {selectedPayment.discount && selectedPayment.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Έκπτωση:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedPayment.discount)}</span>
                    </div>
                  )}
                  {selectedPayment.vatAmount && selectedPayment.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ΦΠΑ:</span>
                      <span className="font-medium">{formatCurrency(selectedPayment.vatAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedPayment.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Περιγραφή</h4>
                <p className="text-sm text-gray-700">{selectedPayment.description}</p>
              </div>
            )}
            
            {selectedPayment.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Σημειώσεις</h4>
                <p className="text-sm text-gray-700">{selectedPayment.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>

export default PaymentHistory