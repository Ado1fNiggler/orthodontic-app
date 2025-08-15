/**
 * Payment Plan Component for Orthodontic App
 * Location: frontend/src/components/financial/PaymentPlan.tsx
 * File #86/90
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyEuroIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody, StatCard } from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

// Types
interface Installment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  paidAmount?: number
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  paymentId?: string
  notes?: string
}

interface PaymentPlan {
  id: string
  patientId: string
  patientName: string
  treatmentPlanId?: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  installments: Installment[]
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  createdDate: string
  completedDate?: string
  frequency: 'weekly' | 'monthly' | 'quarterly'
  notes?: string
  interestRate?: number
  lateFee?: number
}

interface PaymentPlanProps {
  paymentPlan: PaymentPlan
  onInstallmentPay?: (installmentId: string, amount: number) => void
  onPlanEdit?: (plan: PaymentPlan) => void
  onPlanCancel?: (planId: string) => void
  onPlanPause?: (planId: string) => void
  onPlanResume?: (planId: string) => void
  className?: string
}

const PaymentPlan: React.FC<PaymentPlanProps> = ({
  paymentPlan,
  onInstallmentPay,
  onPlanEdit,
  onPlanCancel,
  onPlanPause,
  onPlanResume,
  className
}) => {
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Calculate progress
  const progressPercentage = (paymentPlan.paidAmount / paymentPlan.totalAmount) * 100

  // Get installment status configuration
  const getInstallmentStatusConfig = (installment: Installment) => {
    const today = new Date()
    const dueDate = new Date(installment.dueDate)
    
    switch (installment.status) {
      case 'paid':
        return {
          icon: <CheckCircleIcon className="h-4 w-4" />,
          color: 'text-success-600',
          bg: 'bg-success-100',
          label: 'Πληρωμένη',
          actionable: false
        }
      case 'partial':
        return {
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          color: 'text-warning-600',
          bg: 'bg-warning-100',
          label: 'Μερική πληρωμή',
          actionable: true
        }
      case 'overdue':
        return {
          icon: <XCircleIcon className="h-4 w-4" />,
          color: 'text-error-600',
          bg: 'bg-error-100',
          label: 'Εκπρόθεσμη',
          actionable: true
        }
      case 'cancelled':
        return {
          icon: <XCircleIcon className="h-4 w-4" />,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: 'Ακυρωμένη',
          actionable: false
        }
      default: // pending
        if (dueDate < today) {
          return {
            icon: <XCircleIcon className="h-4 w-4" />,
            color: 'text-error-600',
            bg: 'bg-error-100',
            label: 'Εκπρόθεσμη',
            actionable: true
          }
        }
        return {
          icon: <ClockIcon className="h-4 w-4" />,
          color: 'text-primary-600',
          bg: 'bg-primary-100',
          label: 'Εκκρεμεί',
          actionable: true
        }
    }
  }

  // Get plan status configuration
  const getPlanStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-success-600',
          bg: 'bg-success-100',
          label: 'Ενεργό'
        }
      case 'completed':
        return {
          color: 'text-primary-600',
          bg: 'bg-primary-100',
          label: 'Ολοκληρωμένο'
        }
      case 'paused':
        return {
          color: 'text-warning-600',
          bg: 'bg-warning-100',
          label: 'Παγωμένο'
        }
      case 'cancelled':
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: 'Ακυρωμένο'
        }
      default:
        return {
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

  // Calculate statistics
  const stats = {
    totalInstallments: paymentPlan.installments.length,
    paidInstallments: paymentPlan.installments.filter(i => i.status === 'paid').length,
    overdueInstallments: paymentPlan.installments.filter(i => {
      const today = new Date()
      const dueDate = new Date(i.dueDate)
      return (i.status === 'pending' || i.status === 'partial') && dueDate < today
    }).length,
    nextDueDate: paymentPlan.installments
      .filter(i => i.status === 'pending' || i.status === 'partial')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate
  }

  // Handle installment payment
  const handleInstallmentPayment = (installment: Installment) => {
    const remainingAmount = installment.amount - (installment.paidAmount || 0)
    setSelectedInstallment(installment)
    setPaymentAmount(remainingAmount)
    setPaymentNotes('')
    setShowPaymentModal(true)
  }

  // Submit payment
  const handlePaymentSubmit = () => {
    if (selectedInstallment && onInstallmentPay) {
      onInstallmentPay(selectedInstallment.id, paymentAmount)
      setShowPaymentModal(false)
      setSelectedInstallment(null)
    }
  }

  // Handle plan actions
  const handlePlanEdit = () => {
    onPlanEdit?.(paymentPlan)
  }

  const handlePlanCancel = () => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να ακυρώσετε το σχέδιο αποπληρωμής;')) {
      onPlanCancel?.(paymentPlan.id)
    }
  }

  const handlePlanPause = () => {
    if (window.confirm('Θέλετε να παγώσετε το σχέδιο αποπληρωμής;')) {
      onPlanPause?.(paymentPlan.id)
    }
  }

  const handlePlanResume = () => {
    if (window.confirm('Θέλετε να συνεχίσετε το σχέδιο αποπληρωμής;')) {
      onPlanResume?.(paymentPlan.id)
    }
  }

  const planStatusConfig = getPlanStatusConfig(paymentPlan.status)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Plan Overview */}
      <Card>
        <CardHeader 
          title={`Σχέδιο αποπληρωμής - ${paymentPlan.patientName}`}
          extra={
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planStatusConfig.bg} ${planStatusConfig.color}`}>
                {planStatusConfig.label}
              </span>
              
              <div className="flex space-x-1">
                {paymentPlan.status === 'active' && onPlanEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlanEdit}
                    leftIcon={<PencilIcon />}
                  />
                )}
                
                {paymentPlan.status === 'active' && onPlanPause && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlanPause}
                    leftIcon={<ArrowPathIcon />}
                  />
                )}
                
                {paymentPlan.status === 'paused' && onPlanResume && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlanResume}
                    leftIcon={<ArrowPathIcon />}
                  />
                )}
                
                {['active', 'paused'].includes(paymentPlan.status) && onPlanCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlanCancel}
                    leftIcon={<XCircleIcon />}
                    className="text-error-600 hover:text-error-700"
                  />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<PrinterIcon />}
                />
              </div>
            </div>
          }
        />
        
        <CardBody>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Πρόοδος πληρωμών</span>
              <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-success-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Πληρωμένο: {formatCurrency(paymentPlan.paidAmount)}</span>
              <span>Υπόλοιπο: {formatCurrency(paymentPlan.remainingAmount)}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Συνολικό ποσό"
              value={formatCurrency(paymentPlan.totalAmount)}
              icon={<CurrencyEuroIcon className="h-5 w-5" />}
              color="primary"
            />
            <StatCard
              title="Δόσεις"
              value={`${stats.paidInstallments}/${stats.totalInstallments}`}
              icon={<CheckCircleIcon className="h-5 w-5" />}
              color="success"
            />
            <StatCard
              title="Εκπρόθεσμες"
              value={stats.overdueInstallments}
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              color="error"
            />
            <StatCard
              title="Επόμενη πληρωμή"
              value={stats.nextDueDate ? formatDate(stats.nextDueDate) : 'Καμία'}
              icon={<CalendarDaysIcon className="h-5 w-5" />}
              color="warning"
            />
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Στοιχεία σχεδίου</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Συχνότητα:</span>
                  <span className="font-medium">
                    {paymentPlan.frequency === 'weekly' ? 'Εβδομαδιαία' :
                     paymentPlan.frequency === 'monthly' ? 'Μηνιαία' : 'Τριμηνιαία'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Δημιουργήθηκε:</span>
                  <span className="font-medium">{formatDate(paymentPlan.createdDate)}</span>
                </div>
                {paymentPlan.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ολοκληρώθηκε:</span>
                    <span className="font-medium">{formatDate(paymentPlan.completedDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Οικονομικά στοιχεία</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Πληρωμένο:</span>
                  <span className="font-medium text-success-600">{formatCurrency(paymentPlan.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Υπόλοιπο:</span>
                  <span className="font-medium text-error-600">{formatCurrency(paymentPlan.remainingAmount)}</span>
                </div>
                {paymentPlan.interestRate && paymentPlan.interestRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Επιτόκιο:</span>
                    <span className="font-medium">{paymentPlan.interestRate}%</span>
                  </div>
                )}
                {paymentPlan.lateFee && paymentPlan.lateFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Πρόστιμο καθυστέρησης:</span>
                    <span className="font-medium">{formatCurrency(paymentPlan.lateFee)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Κατάσταση</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ενεργές δόσεις:</span>
                  <span className="font-medium">{stats.totalInstallments - stats.paidInstallments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ολοκληρωμένες:</span>
                  <span className="font-medium text-success-600">{stats.paidInstallments}</span>
                </div>
                {stats.overdueInstallments > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Εκπρόθεσμες:</span>
                    <span className="font-medium text-error-600">{stats.overdueInstallments}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Installments Schedule */}
      <Card>
        <CardHeader title="Πρόγραμμα δόσεων" />
        <CardBody padding="none">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Ημερομηνία</th>
                  <th className="table-header-cell">Ποσό</th>
                  <th className="table-header-cell">Πληρωμένο</th>
                  <th className="table-header-cell">Υπόλοιπο</th>
                  <th className="table-header-cell">Κατάσταση</th>
                  <th className="table-header-cell">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="table-body">
                <AnimatePresence>
                  {paymentPlan.installments
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((installment, index) => {
                      const statusConfig = getInstallmentStatusConfig(installment)
                      const paidAmount = installment.paidAmount || 0
                      const remainingAmount = installment.amount - paidAmount
                      const isOverdue = new Date(installment.dueDate) < new Date() && 
                                       (installment.status === 'pending' || installment.status === 'partial')

                      return (
                        <motion.tr
                          key={installment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`table-row ${isOverdue ? 'bg-error-50' : ''}`}
                        >
                          <td className="table-cell">
                            <span className="font-medium">#{index + 1}</span>
                          </td>
                          
                          <td className="table-cell">
                            <div>
                              <div className="font-medium">{formatDate(installment.dueDate)}</div>
                              {installment.paidDate && (
                                <div className="text-xs text-success-600">
                                  Πληρώθηκε: {formatDate(installment.paidDate)}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="table-cell">
                            <span className="font-semibold">{formatCurrency(installment.amount)}</span>
                          </td>
                          
                          <td className="table-cell">
                            <span className={`font-medium ${paidAmount > 0 ? 'text-success-600' : 'text-gray-400'}`}>
                              {formatCurrency(paidAmount)}
                            </span>
                          </td>
                          
                          <td className="table-cell">
                            <span className={`font-medium ${remainingAmount > 0 ? 'text-error-600' : 'text-gray-400'}`}>
                              {formatCurrency(remainingAmount)}
                            </span>
                          </td>
                          
                          <td className="table-cell">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </span>
                          </td>
                          
                          <td className="table-cell">
                            <div className="flex items-center space-x-2">
                              {statusConfig.actionable && onInstallmentPay && paymentPlan.status === 'active' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleInstallmentPayment(installment)}
                                  leftIcon={<CurrencyEuroIcon />}
                                >
                                  Πληρωμή
                                </Button>
                              )}
                              
                              {installment.paymentId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<DocumentTextIcon />}
                                >
                                  Απόδειξη
                                </Button>
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
        </CardBody>
      </Card>

      {/* Payment Modal */}
      {selectedInstallment && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Πληρωμή δόσης #${paymentPlan.installments.indexOf(selectedInstallment) + 1}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Ημερομηνία:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedInstallment.dueDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ποσό δόσης:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedInstallment.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Πληρωμένο:</span>
                  <span className="ml-2 font-medium text-success-600">
                    {formatCurrency(selectedInstallment.paidAmount || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Υπόλοιπο:</span>
                  <span className="ml-2 font-medium text-error-600">
                    {formatCurrency(selectedInstallment.amount - (selectedInstallment.paidAmount || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Ποσό πληρωμής (€)"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                leftIcon={<CurrencyEuroIcon />}
              />

              <div>
                <label className="form-label">Τρόπος πληρωμής</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="CASH">Μετρητά</option>
                  <option value="CARD">Κάρτα</option>
                  <option value="BANK_TRANSFER">Τραπεζική μεταφορά</option>
                </select>
              </div>

              <Input
                label="Σημειώσεις (προαιρετικό)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Τυχόν σημειώσεις για την πληρωμή..."
              />
            </div>

            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
              >
                Ακύρωση
              </Button>
              <Button
                variant="primary"
                onClick={handlePaymentSubmit}
                disabled={paymentAmount <= 0}
              >
                Καταγραφή πληρωμής
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notes Section */}
      {paymentPlan.notes && (
        <Card>
          <CardHeader title="Σημειώσεις" />
          <CardBody>
            <p className="text-sm text-gray-700">{paymentPlan.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default PaymentPlan