/**
 * Receipt Generator Component for Orthodontic App
 * Location: frontend/src/components/financial/ReceiptGenerator.tsx
 * File #87/90
 */

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '../common/Card'
import Button from '../common/Button'
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
  vatRate?: number
  vatAmount?: number
  discount?: number
  discountReason?: string
  treatmentPlanId?: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  taxId?: string
}

interface ClinicInfo {
  name: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  taxId: string
  website?: string
  logo?: string
}

interface ReceiptGeneratorProps {
  payment: Payment
  patient: Patient
  clinicInfo: ClinicInfo
  isOpen: boolean
  onClose: () => void
  onGenerate?: (format: 'pdf' | 'print') => void
  className?: string
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  payment,
  patient,
  clinicInfo,
  isOpen,
  onClose,
  onGenerate,
  className
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'CASH': return 'Μετρητά'
      case 'CARD': return 'Κάρτα'
      case 'BANK_TRANSFER': return 'Τραπεζική μεταφορά'
      case 'CHECK': return 'Επιταγή'
      case 'INSURANCE': return 'Ασφάλεια'
      default: return 'Άλλο'
    }
  }

  // Generate receipt number if not exists
  const receiptNumber = payment.receiptNumber || 
    `${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

  // Calculate amounts
  const netAmount = payment.amount - (payment.discount || 0)
  const vatAmount = payment.vatAmount || 0
  const totalAmount = netAmount + vatAmount

  // Handle print
  const handlePrint = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      if (printRef.current) {
        const printContent = printRef.current.innerHTML
        const originalContent = document.body.innerHTML
        
        document.body.innerHTML = printContent
        window.print()
        document.body.innerHTML = originalContent
        window.location.reload() // Refresh to restore React functionality
      }
      setIsGenerating(false)
      onGenerate?.('print')
    }, 500)
  }

  // Handle PDF download
  const handleDownloadPDF = () => {
    setIsGenerating(true)
    
    // Here you would integrate with a PDF generation library like jsPDF or Puppeteer
    setTimeout(() => {
      setIsGenerating(false)
      onGenerate?.('pdf')
      // Simulate PDF download
      console.log('PDF generation would happen here')
    }, 1000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Απόδειξη πληρωμής"
      size="lg"
      className={className}
    >
      <div className="space-y-6">
        {/* Preview */}
        <div ref={printRef} className="bg-white">
          {/* Receipt Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {clinicInfo.logo && (
                  <div className="mb-4">
                    <img 
                      src={clinicInfo.logo} 
                      alt="Logo" 
                      className="h-16 w-auto"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{clinicInfo.name}</h1>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>{clinicInfo.address}</p>
                    <p>{clinicInfo.postalCode} {clinicInfo.city}</p>
                    <p>Τηλ: {clinicInfo.phone}</p>
                    <p>Email: {clinicInfo.email}</p>
                    {clinicInfo.website && <p>Web: {clinicInfo.website}</p>}
                    <p>ΑΦΜ: {clinicInfo.taxId}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg inline-block">
                  <h2 className="text-lg font-semibold">ΑΠΟΔΕΙΞΗ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ</h2>
                </div>
                <div className="mt-4 text-sm">
                  <p><span className="font-medium">Αριθμός:</span> {receiptNumber}</p>
                  <p><span className="font-medium">Ημερομηνία:</span> {formatDate(payment.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Στοιχεία ασθενή</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Όνομα:</span> {patient.firstName} {patient.lastName}</p>
                  {patient.email && (
                    <p><span className="font-medium">Email:</span> {patient.email}</p>
                  )}
                  {patient.phone && (
                    <p><span className="font-medium">Τηλέφωνο:</span> {patient.phone}</p>
                  )}
                </div>
                <div>
                  {patient.address && (
                    <p><span className="font-medium">Διεύθυνση:</span> {patient.address}</p>
                  )}
                  {patient.city && (
                    <p><span className="font-medium">Πόλη:</span> {patient.postalCode} {patient.city}</p>
                  )}
                  {patient.taxId && (
                    <p><span className="font-medium">ΑΦΜ:</span> {patient.taxId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Λεπτομέρειες πληρωμής</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Περιγραφή
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ποσό
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.description || 'Ορθοδοντική υπηρεσία'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Τρόπος πληρωμής: {formatPaymentMethod(payment.method)}
                        </p>
                        {payment.category && (
                          <p className="text-sm text-gray-500">
                            Κατηγορία: {
                              payment.category === 'treatment' ? 'Θεραπεία' :
                              payment.category === 'consultation' ? 'Συμβουλευτική' :
                              payment.category === 'equipment' ? 'Εξοπλισμός' : 'Άλλο'
                            }
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                  
                  {payment.discount && payment.discount > 0 && (
                    <tr>
                      <td className="px-4 py-2">
                        <p className="text-sm text-green-600">
                          Έκπτωση
                          {payment.discountReason && ` (${payment.discountReason})`}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-right text-green-600 font-medium">
                        -{formatCurrency(payment.discount)}
                      </td>
                    </tr>
                  )}
                  
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">Καθαρή αξία</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(netAmount)}
                    </td>
                  </tr>
                  
                  {payment.vatRate && payment.vatRate > 0 && (
                    <tr>
                      <td className="px-4 py-2">
                        <p className="text-sm">ΦΠΑ {payment.vatRate}%</p>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(vatAmount)}
                      </td>
                    </tr>
                  )}
                  
                  <tr className="bg-primary-50 border-t-2 border-primary-200">
                    <td className="px-4 py-4 font-bold text-lg">ΣΥΝΟΛΟ</td>
                    <td className="px-4 py-4 text-right font-bold text-lg text-primary-600">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 bg-success-50 text-success-700 p-4 rounded-lg">
              <CheckCircleIcon className="h-6 w-6" />
              <span className="font-semibold text-lg">ΠΛΗΡΩΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</span>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 text-sm text-gray-600">
            {payment.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Σημειώσεις:</h4>
                <p className="bg-gray-50 p-3 rounded">{payment.notes}</p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Σημαντικές πληροφορίες:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Η παρούσα απόδειξη αποτελεί απόδειξη παροχής υπηρεσιών</li>
                <li>Για τυχόν ερωτήσεις επικοινωνήστε μαζί μας</li>
                <li>Η απόδειξη εκδόθηκε ηλεκτρονικά στις {new Date().toLocaleString('el-GR')}</li>
                {payment.vatRate && payment.vatRate > 0 && (
                  <li>Το ΦΠΑ συμπεριλαμβάνεται στο συνολικό ποσό</li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Σας ευχαριστούμε για την προτίμησή σας!
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {clinicInfo.name} - {clinicInfo.website}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p>Απόδειξη #{receiptNumber}</p>
            <p>Εκδόθηκε: {formatDate(payment.date)}</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              leftIcon={<XMarkIcon />}
            >
              Κλείσιμο
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleDownloadPDF}
              loading={isGenerating}
              leftIcon={<ArrowDownTrayIcon />}
            >
              Λήψη PDF
            </Button>
            
            <Button
              variant="primary"
              onClick={handlePrint}
              loading={isGenerating}
              leftIcon={<PrinterIcon />}
            >
              Εκτύπωση
            </Button>
          </div>
        </div>

        {/* Receipt Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Σύνοψη απόδειξης</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-primary-600">{formatCurrency(payment.amount)}</div>
              <div className="text-gray-500">Αρχικό ποσό</div>
            </div>
            
            {payment.discount && payment.discount > 0 && (
              <div className="text-center">
                <div className="font-semibold text-green-600">{formatCurrency(payment.discount)}</div>
                <div className="text-gray-500">Έκπτωση</div>
              </div>
            )}
            
            {payment.vatAmount && payment.vatAmount > 0 && (
              <div className="text-center">
                <div className="font-semibold text-blue-600">{formatCurrency(payment.vatAmount)}</div>
                <div className="text-gray-500">ΦΠΑ</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</div>
              <div className="text-gray-500">Τελικό ποσό</div>
            </div>
          </div>
        </div>

        {/* Template Options (for future enhancement) */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Επιλογές προσαρμογής απόδειξης
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="text-sm">Εμφάνιση λογότυπου</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="text-sm">Στοιχεία ασθενή</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="text-sm">Λεπτομέρειες ΦΠΑ</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="text-sm">Σημειώσεις</span>
              </label>
            </div>
            
            <div>
              <label className="form-label">Μέγεθος γραμματοσειράς</label>
              <select className="form-select text-sm">
                <option value="small">Μικρό</option>
                <option value="medium" selected>Μεσαίο</option>
                <option value="large">Μεγάλο</option>
              </select>
            </div>
          </div>
        </details>
      </div>
    </Modal>
  )
}

export default ReceiptGenerator