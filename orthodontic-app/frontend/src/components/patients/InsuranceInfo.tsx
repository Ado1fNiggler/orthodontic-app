import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  ShieldCheckIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Modal from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'

// API & Types
import { patientApi } from '@api/patientApi'
import { InsuranceInfo as IInsuranceInfo } from '@types/patient'

interface InsuranceInfoProps {
  patientId: string
}

interface InsuranceFormData {
  provider: string
  policyNumber: string
  groupNumber?: string
  coverage: string
  deductible?: number
  maxCoverage?: number
  copayAmount?: number
  copayPercentage?: number
  effectiveDate?: string
  expirationDate?: string
  notes?: string
  isActive: boolean
}

const InsuranceInfo: React.FC<InsuranceInfoProps> = ({ patientId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<InsuranceFormData>()

  // API queries
  const { 
    data: insuranceInfo, 
    isLoading, 
    error 
  } = useQuery(
    ['insurance-info', patientId],
    () => patientApi.getInsuranceInfo(patientId),
    {
      enabled: !!patientId,
      onSuccess: (data) => {
        if (data) {
          reset({
            provider: data.provider || '',
            policyNumber: data.policyNumber || '',
            groupNumber: data.groupNumber || '',
            coverage: data.coverage || '',
            deductible: data.deductible,
            maxCoverage: data.maxCoverage,
            copayAmount: data.copayAmount,
            copayPercentage: data.copayPercentage,
            effectiveDate: data.effectiveDate ? new Date(data.effectiveDate).toISOString().split('T')[0] : '',
            expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString().split('T')[0] : '',
            notes: data.notes || '',
            isActive: data.isActive ?? true
          })
        }
      }
    }
  )

  // Mutations
  const updateInsuranceMutation = useMutation(
    (data: Partial<IInsuranceInfo>) => patientApi.updateInsuranceInfo(patientId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['insurance-info', patientId])
        toast.success('Τα στοιχεία ασφάλισης ενημερώθηκαν επιτυχώς')
        setIsEditing(false)
      },
      onError: () => {
        toast.error('Σφάλμα κατά την ενημέρωση των στοιχείων ασφάλισης')
      }
    }
  )

  // Handlers
  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to original values
    if (insuranceInfo) {
      reset({
        provider: insuranceInfo.provider || '',
        policyNumber: insuranceInfo.policyNumber || '',
        groupNumber: insuranceInfo.groupNumber || '',
        coverage: insuranceInfo.coverage || '',
        deductible: insuranceInfo.deductible,
        maxCoverage: insuranceInfo.maxCoverage,
        copayAmount: insuranceInfo.copayAmount,
        copayPercentage: insuranceInfo.copayPercentage,
        effectiveDate: insuranceInfo.effectiveDate ? new Date(insuranceInfo.effectiveDate).toISOString().split('T')[0] : '',
        expirationDate: insuranceInfo.expirationDate ? new Date(insuranceInfo.expirationDate).toISOString().split('T')[0] : '',
        notes: insuranceInfo.notes || '',
        isActive: insuranceInfo.isActive ?? true
      })
    }
  }

  const onSubmit = (data: InsuranceFormData) => {
    const updateData: Partial<IInsuranceInfo> = {
      ...data,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined
    }
    
    updateInsuranceMutation.mutate(updateData)
  }

  const isExpired = insuranceInfo?.expirationDate && new Date(insuranceInfo.expirationDate) < new Date()
  const isExpiringSoon = insuranceInfo?.expirationDate && 
    new Date(insuranceInfo.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-gray-500">Φόρτωση στοιχείων ασφάλισης...</p>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-red-600">
          <p>Σφάλμα κατά τη φόρτωση των στοιχείων ασφάλισης</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader 
          title="Στοιχεία Ασφάλισης"
          extra={
            !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                leftIcon={<PencilIcon />}
              >
                Επεξεργασία
              </Button>
            )
          }
        />
        <CardBody>
          {!insuranceInfo && !isEditing ? (
            <div className="text-center py-8">
              <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν υπάρχουν στοιχεία ασφάλισης
              </h3>
              <p className="text-gray-500 mb-4">
                Προσθέστε στοιχεία ασφαλιστικής κάλυψης για τον ασθενή
              </p>
              <Button onClick={handleEdit} leftIcon={<PencilIcon />}>
                Προσθήκη στοιχείων ασφάλισης
              </Button>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Βασικά Στοιχεία</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ασφαλιστική Εταιρεία"
                    {...register('provider', { required: 'Η ασφαλιστική εταιρεία είναι υποχρεωτική' })}
                    error={errors.provider?.message}
                    placeholder="π.χ. ΕΟΠΥΥ, IKA"
                    required
                  />

                  <Input
                    label="Αριθμός Πολιτικής"
                    {...register('policyNumber', { required: 'Ο αριθμός πολιτικής είναι υποχρεωτικός' })}
                    error={errors.policyNumber?.message}
                    placeholder="π.χ. 12345678"
                    required
                  />

                  <Input
                    label="Αριθμός Ομάδας"
                    {...register('groupNumber')}
                    error={errors.groupNumber?.message}
                    placeholder="π.χ. GRP001"
                  />

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label className="text-sm text-gray-700">
                      Ενεργή ασφάλιση
                    </label>
                  </div>
                </div>
              </div>

              {/* Coverage Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Λεπτομέρειες Κάλυψης</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Περιγραφή Κάλυψης
                    </label>
                    <textarea
                      {...register('coverage')}
                      rows={3}
                      className="form-textarea"
                      placeholder="Περιγράψτε τι καλύπτει η ασφάλιση..."
                    />
                  </div>

                  <Input
                    label="Απαλλακτικό (€)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('deductible', { valueAsNumber: true })}
                    error={errors.deductible?.message}
                    placeholder="0.00"
                  />

                  <Input
                    label="Μέγιστη Κάλυψη (€)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('maxCoverage', { valueAsNumber: true })}
                    error={errors.maxCoverage?.message}
                    placeholder="1000.00"
                  />

                  <Input
                    label="Συμμετοχή Ποσό (€)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('copayAmount', { valueAsNumber: true })}
                    error={errors.copayAmount?.message}
                    placeholder="10.00"
                  />

                  <Input
                    label="Συμμετοχή Ποσοστό (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    {...register('copayPercentage', { valueAsNumber: true })}
                    error={errors.copayPercentage?.message}
                    placeholder="20.0"
                  />
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Ημερομηνίες</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ημερομηνία Έναρξης"
                    type="date"
                    {...register('effectiveDate')}
                    error={errors.effectiveDate?.message}
                  />

                  <Input
                    label="Ημερομηνία Λήξης"
                    type="date"
                    {...register('expirationDate')}
                    error={errors.expirationDate?.message}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Σημειώσεις
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="form-textarea"
                  placeholder="Πρόσθετες πληροφορίες για την ασφάλιση..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Ακύρωση
                </Button>
                
                <Button
                  type="submit"
                  loading={updateInsuranceMutation.isLoading}
                  disabled={!isValid || !isDirty}
                >
                  Αποθήκευση
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {insuranceInfo.isActive ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    insuranceInfo.isActive ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {insuranceInfo.isActive ? 'Ενεργή' : 'Ανενεργή'}
                  </span>
                </div>

                {isExpired && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Έχει λήξει
                  </span>
                )}

                {!isExpired && isExpiringSoon && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Λήγει σύντομα
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Βασικά Στοιχεία
                </h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ασφαλιστική Εταιρεία</dt>
                    <dd className="text-sm text-gray-900">{insuranceInfo.provider}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Αριθμός Πολιτικής</dt>
                    <dd className="text-sm text-gray-900 font-mono">{insuranceInfo.policyNumber}</dd>
                  </div>
                  {insuranceInfo.groupNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Αριθμός Ομάδας</dt>
                      <dd className="text-sm text-gray-900 font-mono">{insuranceInfo.groupNumber}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Coverage Details */}
              {(insuranceInfo.coverage || insuranceInfo.deductible || insuranceInfo.maxCoverage) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Κάλυψη
                  </h4>
                  
                  {insuranceInfo.coverage && (
                    <div className="mb-3">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Περιγραφή</dt>
                      <dd className="text-sm text-gray-900">{insuranceInfo.coverage}</dd>
                    </div>
                  )}

                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insuranceInfo.deductible && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Απαλλακτικό</dt>
                        <dd className="text-sm text-gray-900">€{insuranceInfo.deductible}</dd>
                      </div>
                    )}
                    {insuranceInfo.maxCoverage && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Μέγιστη Κάλυψη</dt>
                        <dd className="text-sm text-gray-900">€{insuranceInfo.maxCoverage}</dd>
                      </div>
                    )}
                    {insuranceInfo.copayAmount && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Συμμετοχή</dt>
                        <dd className="text-sm text-gray-900">€{insuranceInfo.copayAmount}</dd>
                      </div>
                    )}
                    {insuranceInfo.copayPercentage && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Συμμετοχή %</dt>
                        <dd className="text-sm text-gray-900">{insuranceInfo.copayPercentage}%</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Dates */}
              {(insuranceInfo.effectiveDate || insuranceInfo.expirationDate) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Ημερομηνίες
                  </h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insuranceInfo.effectiveDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Ημερομηνία Έναρξης</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(insuranceInfo.effectiveDate).toLocaleDateString('el-GR')}
                        </dd>
                      </div>
                    )}
                    {insuranceInfo.expirationDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Ημερομηνία Λήξης</dt>
                        <dd className={`text-sm ${
                          isExpired ? 'text-red-600 font-medium' :
                          isExpiringSoon ? 'text-yellow-600 font-medium' :
                          'text-gray-900'
                        }`}>
                          {new Date(insuranceInfo.expirationDate).toLocaleDateString('el-GR')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Notes */}
              {insuranceInfo.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Σημειώσεις</h4>
                  <p className="text-sm text-gray-600">{insuranceInfo.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default InsuranceInfo