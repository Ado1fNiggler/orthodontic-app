/**
 * Payment Form Component for Orthodontic App
 * Location: frontend/src/components/financial/PaymentForm.tsx
 * File #84/90
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CurrencyEuroIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

// Types
interface Payment {
  id: string
  patientId: string
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
}

interface InstallmentPlan {
  id: string
  patientId: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  installments: Installment[]
  status: 'active' | 'completed' | 'cancelled'
  createdDate: string
}

interface Installment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'pending' | 'paid' | 'overdue'
  paymentId?: string
}

interface PaymentFormProps {
  patientId: string
  patientName?: string
  treatmentCost?: number
  paidAmount?: number
  installmentPlan?: InstallmentPlan
  isOpen: boolean
  onClose: () => void
  onPaymentSave: (payment: Payment) => void
  onInstallmentPlanCreate?: (plan: InstallmentPlan) => void
  className?: string
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  patientId,
  patientName,
  treatmentCost = 0,
  paidAmount = 0,
  installmentPlan,
  isOpen,
  onClose,
  onPaymentSave,
  onInstallmentPlanCreate,
  className
}) => {
  const [formData, setFormData] = useState<Partial<Payment>>({
    patientId,
    amount: 0,
    method: 'CASH',
    date: new Date().toISOString().split('T')[0],
    category: 'treatment',
    status: 'PAID',
    vatRate: 24,
    discount: 0
  })

  const [showInstallmentForm, setShowInstallmentForm] = useState(false)
  const [installmentFormData, setInstallmentFormData] = useState({
    totalAmount: treatmentCost - paidAmount,
    numberOfInstallments: 3,
    firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Payment method options
  const paymentMethodOptions = [
    { label: 'Μετρητά', value: 'CASH', icon: <BanknotesIcon className="h-4 w-4" /> },
    { label: 'Κάρτα', value: 'CARD', icon: <CreditCardIcon className="h-4 w-4" /> },
    { label: 'Τραπεζική μεταφορά', value: 'BANK_TRANSFER', icon: <BanknotesIcon className="h-4 w-4" /> },
    { label: 'Επιταγή', value: 'CHECK', icon: <DocumentTextIcon className="h-4 w-4" /> },
    { label: 'Ασφάλεια', value: 'INSURANCE', icon: <DocumentTextIcon className="h-4 w-4" /> },
    { label: 'Άλλο', value: 'OTHER', icon: <DocumentTextIcon className="h-4 w-4" /> }
  ]

  const categoryOptions = [
    { label: 'Θεραπεία', value: 'treatment' },
    { label: 'Συμβουλευτική', value: 'consultation' },
    { label: 'Εξοπλισμός', value: 'equipment' },
    { label: 'Άλλο', value: 'other' }
  ]

  const statusOptions = [
    { label: 'Πληρωμένη', value: 'PAID' },
    { label: 'Εκκρεμεί', value: 'PENDING' },
    { label: 'Μερική', value: 'PARTIAL' },
    { label: 'Εκπρόθεσμη', value: 'OVERDUE' },
    { label: 'Ακυρωμένη', value: 'CANCELLED' },
    { label: 'Επιστράφηκε', value: 'REFUNDED' }
  ]

  const frequencyOptions = [
    { label: 'Εβδομαδιαία', value: 'weekly' },
    { label: 'Μηνιαία', value: 'monthly' },
    { label: 'Τριμηνιαία', value: 'quarterly' }
  ]

  // Calculate remaining amount
  const remainingAmount = treatmentCost - paidAmount

  // Calculate VAT amount
  const vatAmount = formData.vatRate ? (formData.amount || 0) * (formData.vatRate / 100) : 0

  // Calculate total after discount and VAT
  const discountAmount = formData.discount || 0
  const netAmount = (formData.amount || 0) - discountAmount
  const totalAmount = netAmount + vatAmount

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Το ποσό είναι υποχρεωτικό'
    }

    if (formData.amount && formData.amount > remainingAmount && formData.method !== 'INSURANCE') {
      newErrors.amount = 'Το ποσό δεν μπορεί να υπερβαίνει το υπόλοιπο'
    }

    if (!formData.date) {
      newErrors.date = 'Η ημερομηνία είναι υποχρεωτική'
    }

    if (formData.discount && formData.discount >= (formData.amount || 0)) {
      newErrors.discount = 'Η έκπτωση δεν μπορεί να είναι μεγαλύτερη από το ποσό'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return

    const payment: Payment = {
      id: `payment-${Date.now()}`,
      patientId,
      amount: formData.amount || 0,
      method: formData.method || 'CASH',
      date: formData.date || new Date().toISOString().split('T')[0],
      description: formData.description,
      receiptNumber: formData.receiptNumber,
      notes: formData.notes,
      category: formData.category || 'treatment',
      status: formData.status || 'PAID',
      installmentPlanId: formData.installmentPlanId,
      vatRate: formData.vatRate,
      vatAmount,
      discount: formData.discount,
      discountReason: formData.discountReason,
      treatmentPlanId: formData.treatmentPlanId
    }

    onPaymentSave(payment)
    handleClose()
  }

  // Handle installment plan creation
  const handleInstallmentPlanSubmit = () => {
    if (!onInstallmentPlanCreate) return

    const installments: Installment[] = []
    const installmentAmount = installmentFormData.totalAmount / installmentFormData.numberOfInstallments

    for (let i = 0; i < installmentFormData.numberOfInstallments; i++) {
      const dueDate = new Date(installmentFormData.firstPaymentDate)
      
      switch (installmentFormData.frequency) {
        case 'weekly':
          dueDate.setDate(dueDate.getDate() + (i * 7))
          break
        case 'monthly':
          dueDate.setMonth(dueDate.getMonth() + i)
          break
        case 'quarterly':
          dueDate.setMonth(dueDate.getMonth() + (i * 3))
          break
      }

      installments.push({
        id: `installment-${Date.now()}-${i}`,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending'
      })
    }

    const plan: InstallmentPlan = {
      id: `plan-${Date.now()}`,
      patientId,
      totalAmount: installmentFormData.totalAmount,
      paidAmount: 0,
      remainingAmount: installmentFormData.totalAmount,
      installments,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    }

    onInstallmentPlanCreate(plan)
    setShowInstallmentForm(false)
    handleClose()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Handle close
  const handleClose = () => {
    setFormData({
      patientId,
      amount: 0,
      method: 'CASH',
      date: new Date().toISOString().split('T')[0],
      category: 'treatment',
      status: 'PAID',
      vatRate: 24,
      discount: 0
    })
    setErrors({})
    setShowInstallmentForm(false)
    onClose()
  }

  // Dropdown component (inline for this component)
  const Dropdown: React.FC<{
    options: Array<{label: string, value: string, icon?: React.ReactNode}>
    value?: string
    onChange: (value: string) => void
    placeholder?: string
  }> = ({ options, value, onChange, placeholder = "Επιλέξτε..." }) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectedOption = options.find(opt => opt.value === value)

    return (
      <div className="relative">
        <button
          type="button"
          className="form-input flex items-center justify-between w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center space-x-2">
            {selectedOption?.icon}
            <span>{selectedOption?.label || placeholder}</span>
          </span>
          <XMarkIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (showInstallmentForm) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Δημιουργία σχεδίου αποπληρωμής"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Στοιχεία σχεδίου</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Συνολικό ποσό:</span>
                <span className="ml-2 font-medium">{formatCurrency(installmentFormData.totalAmount)}</span>
              </div>
              <div>
                <span className="text-blue-700">Αριθμός δόσεων:</span>
                <span className="ml-2 font-medium">{installmentFormData.numberOfInstallments}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Συνολικό ποσό (€)"
              type="number"
              step="0.01"
              value={installmentFormData.totalAmount}
              onChange={(e) => setInstallmentFormData(prev => ({ 
                ...prev, 
                totalAmount: parseFloat(e.target.value) || 0 
              }))}
              leftIcon={<CurrencyEuroIcon />}
            />

            <Input
              label="Αριθμός δόσεων"
              type="number"
              min="2"
              max="24"
              value={installmentFormData.numberOfInstallments}
              onChange={(e) => setInstallmentFormData(prev => ({ 
                ...prev, 
                numberOfInstallments: parseInt(e.target.value) || 3 
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ημερομηνία πρώτης δόσης"
              type="date"
              value={installmentFormData.firstPaymentDate}
              onChange={(e) => setInstallmentFormData(prev => ({ 
                ...prev, 
                firstPaymentDate: e.target.value 
              }))}
              leftIcon={<CalendarDaysIcon />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Συχνότητα πληρωμών
              </label>
              <Dropdown
                options={frequencyOptions}
                value={installmentFormData.frequency}
                onChange={(value) => setInstallmentFormData(prev => ({ 
                  ...prev, 
                  frequency: value as 'weekly' | 'monthly' | 'quarterly'
                }))}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Προεπισκόπηση δόσεων</h4>
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Ποσό ανά δόση:</span>
                <span className="font-medium">
                  {formatCurrency(installmentFormData.totalAmount / installmentFormData.numberOfInstallments)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowInstallmentForm(false)}
            >
              Ακύρωση
            </Button>
            <Button
              variant="primary"
              onClick={handleInstallmentPlanSubmit}
            >
              Δημιουργία σχεδίου
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Καταγραφή πληρωμής"
      size="lg"
    >
      <div className="space-y-6">
        {/* Patient and Treatment Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Ασθενής:</span>
              <span className="ml-2 font-medium">{patientName}</span>
            </div>
            <div>
              <span className="text-gray-500">Συνολικό κόστος:</span>
              <span className="ml-2 font-medium">{formatCurrency(treatmentCost)}</span>
            </div>
            <div>
              <span className="text-gray-500">Πληρωμένο:</span>
              <span className="ml-2 font-medium text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div>
              <span className="text-gray-500">Υπόλοιπο:</span>
              <span className="ml-2 font-medium text-red-600">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ποσό πληρωμής (€)"
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            error={errors.amount}
            leftIcon={<CurrencyEuroIcon />}
          />

          <Input
            label="Ημερομηνία πληρωμής"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            error={errors.date}
            leftIcon={<CalendarDaysIcon />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Τρόπος πληρωμής
            </label>
            <Dropdown
              options={paymentMethodOptions}
              value={formData.method}
              onChange={(value) => setFormData(prev => ({ ...prev, method: value as Payment['method'] }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Κατηγορία
            </label>
            <Dropdown
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value as Payment['category'] }))}
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <Input
            label="Περιγραφή πληρωμής (προαιρετικό)"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="π.χ. Πληρωμή φάσης 1, Αρχική συμβουλευτική..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Αριθμός απόδειξης (προαιρετικό)"
              value={formData.receiptNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
              placeholder="π.χ. 2024-001"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Κατάσταση πληρωμής
              </label>
              <Dropdown
                options={statusOptions}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as Payment['status'] }))}
              />
            </div>
          </div>
        </div>

        {/* Discount and VAT */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Έκπτωση και ΦΠΑ</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Έκπτωση (€)"
              type="number"
              step="0.01"
              value={formData.discount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
              error={errors.discount}
              leftIcon={<ReceiptPercentIcon />}
            />

            <Input
              label="ΦΠΑ (%)"
              type="number"
              step="0.01"
              value={formData.vatRate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ποσό ΦΠΑ
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                {formatCurrency(vatAmount)}
              </div>
            </div>
          </div>

          {formData.discount && formData.discount > 0 && (
            <div className="mt-3">
              <Input
                label="Λόγος έκπτωσης"
                value={formData.discountReason || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                placeholder="π.χ. Έκπτωση φοιτητή, Οικογενειακή έκπτωση..."
              />
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Σύνοψη πληρωμής</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Ποσό:</span>
              <span className="text-blue-900 font-medium">{formatCurrency(formData.amount || 0)}</span>
            </div>
            {formData.discount && formData.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-700">Έκπτωση:</span>
                <span className="text-blue-900 font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-blue-700">Καθαρό ποσό:</span>
              <span className="text-blue-900 font-medium">{formatCurrency(netAmount)}</span>
            </div>
            {vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-700">ΦΠΑ ({formData.vatRate}%):</span>
                <span className="text-blue-900 font-medium">{formatCurrency(vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-blue-200 pt-1 mt-2">
              <span className="text-blue-700 font-medium">Σύνολο:</span>
              <span className="text-blue-900 font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Ακύρωση
          </Button>
          
          {onInstallmentPlanCreate && !installmentPlan && (
            <Button
              variant="secondary"
              onClick={() => setShowInstallmentForm(true)}
            >
              Σχέδιο αποπληρωμής
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Αποθήκευση πληρωμής
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PaymentForm