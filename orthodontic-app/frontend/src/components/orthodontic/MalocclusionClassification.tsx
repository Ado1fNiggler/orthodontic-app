lowerTeethWidth: 0,
      lowerSpaceAnalysis: 0,
      dentalMidlineDeviation: 0,
      facialMidlineDeviation: 0,
      functionalShift: false,
      openBite: false,
      deepBite: false,
      impactedTeeth: [],
      supernumeraryTeeth: [],
      congenitallyMissingTeeth: [],
      severity: 'mild',
      complexity: 'low'
    }
  )

  const [isEditing, setIsEditing] = useState(!initialAssessment)
  const [showCriteriaModal, setShowCriteriaModal] = useState(false)

  // Classification criteria
  const criteria: ClassificationCriteria = {
    angleClass: {
      I: 'Η μεσειοβουκκή ακρολοφία του πρώτου άνω γομφίου εδράζεται στη μεσειοβουκκή αύλακα του πρώτου κάτω γομφίου',
      II: 'Η μεσειοβουκκή ακρολοφία του πρώτου άνω γομφίου εδράζεται μεσιακά της μεσειοβουκκής αύλακας του πρώτου κάτω γομφίου',
      III: 'Η μεσειοβουκκή ακρολοφία του πρώτου άνω γομφίου εδράζεται απομεσιακά της μεσειοβουκκής αύλακας του πρώτου κάτω γομφίου'
    },
    incisorClass: {
      'I': 'Κανονική οριζόντια και κάθετη επικάλυψη (overjet 2-4mm, overbite 2-4mm)',
      'II-1': 'Αυξημένη οριζόντια επικάλυψη με εκτεταμένους άνω τομείς (overjet >4mm)',
      'II-2': 'Αυξημένη οριζόντια επικάλυψη με κεκλιμένους άνω κεντρικούς τομείς',
      'III': 'Αντεστραμμένη οριζόντια επικάλυψη (overjet αρνητικό)'
    },
    canineClass: {
      I: 'Η ακρολοφία του άνω κυνόδοντα εδράζεται στη μεσόεγγο επιφάνεια μεταξύ κάτω κυνόδοντα και πρώτου προγομφίου',
      II: 'Η ακρολοφία του άνω κυνόδοντα εδράζεται μεσιακά της μεσόεγγης επιφάνειας του κάτω κυνόδοντα',
      III: 'Η ακρολοφία του άνω κυνόδοντα εδράζεται απομεσιακά της μεσόεγγης επιφάνειας του κάτω κυνόδοντα'
    }
  }

  // Options for dropdowns
  const classOptions = [
    { label: 'Κλάση I', value: 'I' },
    { label: 'Κλάση II', value: 'II' },
    { label: 'Κλάση III', value: 'III' }
  ]

  const incisorClassOptions = [
    { label: 'Κλάση I', value: 'I' },
    { label: 'Κλάση II/1', value: 'II-1' },
    { label: 'Κλάση II/2', value: 'II-2' },
    { label: 'Κλάση III', value: 'III' }
  ]

  const severityOptions = [
    { label: 'Ήπια', value: 'mild' },
    { label: 'Μέτρια', value: 'moderate' },
    { label: 'Σοβαρή', value: 'severe' }
  ]

  const complexityOptions = [
    { label: 'Χαμηλή', value: 'low' },
    { label: 'Μέτρια', value: 'medium' },
    { label: 'Υψηλή', value: 'high' }
  ]

  // Calculate severity automatically based on measurements
  const calculateSeverity = useMemo(() => {
    let score = 0

    // Overjet scoring
    if (Math.abs(assessment.overjet) > 9) score += 5
    else if (Math.abs(assessment.overjet) > 6) score += 4
    else if (Math.abs(assessment.overjet) > 4) score += 2

    // Overbite scoring
    if (assessment.overbite > 100 || assessment.overbite < 0) score += 4
    else if (assessment.overbite > 50 || assessment.overbite < 10) score += 2

    // Crowding scoring
    const maxCrowding = Math.max(
      Math.abs(assessment.upperSpaceAnalysis),
      Math.abs(assessment.lowerSpaceAnalysis)
    )
    if (maxCrowding > 7) score += 4
    else if (maxCrowding > 4) score += 2
    else if (maxCrowding > 1) score += 1

    // Crossbite scoring
    if (assessment.anteriorCrossbite) score += 3
    if (assessment.posteriorCrossbiteRight || assessment.posteriorCrossbiteLeft) score += 2

    // Midline deviation
    if (Math.abs(assessment.dentalMidlineDeviation) > 3) score += 2
    else if (Math.abs(assessment.dentalMidlineDeviation) > 1) score += 1

    // Missing teeth
    score += assessment.congenitallyMissingTeeth.length
    score += assessment.impactedTeeth.length * 2

    if (score >= 15) return 'severe'
    if (score >= 8) return 'moderate'
    return 'mild'
  }, [assessment])

  // Update assessment
  const updateAssessment = (updates: Partial<MalocclusionAssessment>) => {
    setAssessment(prev => ({
      ...prev,
      ...updates,
      severity: calculateSeverity
    }))
  }

  // Handle save
  const handleSave = () => {
    onSave?.(assessment)
    setIsEditing(false)
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'severe': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get class color
  const getClassColor = (classification: string) => {
    switch (classification) {
      case 'I': return 'bg-green-100 text-green-800'
      case 'II':
      case 'II-1':
      case 'II-2': return 'bg-blue-100 text-blue-800'
      case 'III': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Ταξινόμηση Κακοκκλεισίας"
          extra={
            <div className="flex items-center space-x-2">
              {showCriteria && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCriteriaModal(true)}
                  leftIcon={<BookOpenIcon />}
                >
                  Κριτήρια
                </Button>
              )}
              
              {!readonly && (
                <>
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Ακύρωση
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        Αποθήκευση
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<PencilIcon />}
                    >
                      Επεξεργασία
                    </Button>
                  )}
                </>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-8">
            {/* Assessment Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getClassColor(assessment.angleClass)}`}>
                  Angle {assessment.angleClass}
                </div>
                <div className="text-xs text-gray-500 mt-1">Angle Classification</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getClassColor(assessment.incisorClass)}`}>
                  {assessment.incisorClass}
                </div>
                <div className="text-xs text-gray-500 mt-1">Incisor Classification</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getSeverityColor(assessment.severity)}`}>
                  {severityOptions.find(opt => opt.value === assessment.severity)?.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">Σοβαρότητα</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getSeverityColor(assessment.complexity)}`}>
                  {complexityOptions.find(opt => opt.value === assessment.complexity)?.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">Πολυπλοκότητα</div>
              </div>
            </div>

            {/* Angle Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ταξινόμηση Angle</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Κλάση Angle
                    </label>
                    {isEditing ? (
                      <Dropdown
                        options={classOptions}
                        value={assessment.angleClass}
                        onChange={(value) => updateAssessment({ angleClass: value as any })}
                      />
                    ) : (
                      <p className="text-gray-900">Κλάση {assessment.angleClass}</p>
                    )}
                  </div>

                  {assessment.angleSubdivision && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Υποδιαίρεση
                      </label>
                      <p className="text-gray-900">{assessment.angleSubdivision}</p>
                    </div>
                  )}

                  {assessment.angleNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Σημειώσεις
                      </label>
                      <p className="text-gray-600 text-sm">{assessment.angleNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Incisor Classification */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ταξινόμηση Τομέων</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Κλάση Τομέων
                    </label>
                    {isEditing ? (
                      <Dropdown
                        options={incisorClassOptions}
                        value={assessment.incisorClass}
                        onChange={(value) => updateAssessment({ incisorClass: value as any })}
                      />
                    ) : (
                      <p className="text-gray-900">Κλάση {assessment.incisorClass}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overjet (mm)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={assessment.overjet}
                          onChange={(e) => updateAssessment({ overjet: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{assessment.overjet} mm</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overbite (%)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="5"
                          value={assessment.overbite}
                          onChange={(e) => updateAssessment({ overbite: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{assessment.overbite}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canine Classification */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ταξινόμηση Κυνοδόντων</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Δεξιά κλάση
                  </label>
                  {isEditing ? (
                    <Dropdown
                      options={classOptions}
                      value={assessment.canineClassRight}
                      onChange={(value) => updateAssessment({ canineClassRight: value as any })}
                    />
                  ) : (
                    <p className="text-gray-900">Κλάση {assessment.canineClassRight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Αριστερή κλάση
                  </label>
                  {isEditing ? (
                    <Dropdown
                      options={classOptions}
                      value={assessment.canineClassLeft}
                      onChange={(value) => updateAssessment({ canineClassLeft: value as any })}
                    />
                  ) : (
                    <p className="text-gray-900">Κλάση {assessment.canineClassLeft}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Crossbites */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Σταυρώσεις</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'anteriorCrossbite', label: 'Πρόσθια σταύρωση' },
                  { key: 'posteriorCrossbiteRight', label: 'Οπίσθια σταύρωση δεξιά' },
                  { key: 'posteriorCrossbiteLeft', label: 'Οπίσθια σταύρωση αριστερά' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={assessment[key as keyof MalocclusionAssessment] as boolean}
                      onChange={(e) => updateAssessment({ [key]: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={key} className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Space Analysis */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ανάλυση Χώρου</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Άνω Αψίδα</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Μήκος αψίδας (mm)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={assessment.upperArchLength}
                            onChange={(e) => updateAssessment({ upperArchLength: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{assessment.upperArchLength} mm</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Πλάτος δοντιών (mm)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={assessment.upperTeethWidth}
                            onChange={(e) => updateAssessment({ upperTeethWidth: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{assessment.upperTeethWidth} mm</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ανάλυση χώρου (mm)
                      </label>
                      <div className={`p-2 rounded text-sm font-medium ${
                        assessment.upperSpaceAnalysis < 0 
                          ? 'bg-red-100 text-red-800' 
                          : assessment.upperSpaceAnalysis > 0 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.upperSpaceAnalysis} mm
                        {assessment.upperSpaceAnalysis < 0 && ' (συνωστισμός)'}
                        {assessment.upperSpaceAnalysis > 0 && ' (διάστημα)'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Κάτω Αψίδα</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Μήκος αψίδας (mm)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={assessment.lowerArchLength}
                            onChange={(e) => updateAssessment({ lowerArchLength: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{assessment.lowerArchLength} mm</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Πλάτος δοντιών (mm)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={assessment.lowerTeethWidth}
                            onChange={(e) => updateAssessment({ lowerTeethWidth: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{assessment.lowerTeethWidth} mm</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ανάλυση χώρου (mm)
                      </label>
                      <div className={`p-2 rounded text-sm font-medium ${
                        assessment.lowerSpaceAnalysis < 0 
                          ? 'bg-red-100 text-red-800' 
                          : assessment.lowerSpaceAnalysis > 0 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.lowerSpaceAnalysis} mm
                        {assessment.lowerSpaceAnalysis < 0 && ' (συνωστισμός)'}
                        {assessment.lowerSpaceAnalysis > 0 && ' (διάστημα)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatically calculate space analysis */}
              {isEditing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="text-blue-800 font-medium mb-1">Αυτόματος υπολογισμός:</p>
                  <p className="text-blue-700">
                    Ανάλυση χώρου = Μήκος αψίδας - Πλάτος δοντιών
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAssessment({ 
                        upperSpaceAnalysis: assessment.upperArchLength - assessment.upperTeethWidth 
                      })}
                    >
                      Υπολογισμός άνω
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAssessment({ 
                        lowerSpaceAnalysis: assessment.lowerArchLength - assessment.lowerTeethWidth 
                      })}
                    >
                      Υπολογισμός κάτω
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Findings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Επιπλέον Ευρήματα</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { key: 'openBite', label: 'Ανοικτό δάγκωμα' },
                    { key: 'deepBite', label: 'Βαθύ δάγκωμα' },
                    { key: 'functionalShift', label: 'Λειτουργική μετατόπιση' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={assessment[key as keyof MalocclusionAssessment] as boolean}
                        onChange={(e) => updateAssessment({ [key]: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor={key} className="text-sm font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Απόκλιση μεσ. γραμμής (mm)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={assessment.dentalMidlineDeviation}
                          onChange={(e) => updateAssessment({ dentalMidlineDeviation: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{assessment.dentalMidlineDeviation} mm</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Προσωπική μεσ. γραμμή (mm)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={assessment.facialMidlineDeviation}
                          onChange={(e) => updateAssessment({ facialMidlineDeviation: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-900">{assessment.facialMidlineDeviation} mm</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Assessment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Συνολική Αξιολόγηση</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Σοβαρότητα
                  </label>
                  {isEditing ? (
                    <Dropdown
                      options={severityOptions}
                      value={assessment.severity}
                      onChange={(value) => updateAssessment({ severity: value as any })}
                    />
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.severity)}`}>
                      {severityOptions.find(opt => opt.value === assessment.severity)?.label}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Πολυπλοκότητα
                  </label>
                  {isEditing ? (
                    <Dropdown
                      options={complexityOptions}
                      value={assessment.complexity}
                      onChange={(value) => updateAssessment({ complexity: value as any })}
                    />
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(assessment.complexity)}`}>
                      {complexityOptions.find(opt => opt.value === assessment.complexity)?.label}
                    </span>
                  )}/**
 * Malocclusion Classification Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/MalocclusionClassification.tsx
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Dropdown from '@components/common/Dropdown'

// Types
interface MalocclusionAssessment {
  id: string
  patientId: string
  assessmentDate: string
  assessedBy: string
  
  // Angle Classification
  angleClass: 'I' | 'II' | 'III'
  angleSubdivision?: 'left' | 'right' | 'bilateral'
  angleNotes?: string
  
  // Incisor Classification
  incisorClass: 'I' | 'II-1' | 'II-2' | 'III'
  overjet: number // mm
  overbite: number // mm or %
  
  // Canine Classification
  canineClassRight: 'I' | 'II' | 'III'
  canineClassLeft: 'I' | 'II' | 'III'
  
  // Crossbites
  anteriorCrossbite: boolean
  posteriorCrossbiteRight: boolean
  posteriorCrossbiteLeft: boolean
  crossbiteTeeth?: number[]
  
  // Spacing/Crowding
  upperArchLength: number // mm
  upperTeethWidth: number // mm
  upperSpaceAnalysis: number // mm (negative = crowding)
  
  lowerArchLength: number // mm
  lowerTeethWidth: number // mm
  lowerSpaceAnalysis: number // mm
  
  // Midlines
  dentalMidlineDeviation: number // mm (+ = right, - = left)
  facialMidlineDeviation: number // mm
  
  // Functional Analysis
  functionalShift: boolean
  functionalShiftDirection?: 'anterior' | 'posterior' | 'lateral-right' | 'lateral-left'
  
  // Additional findings
  openBite: boolean
  deepBite: boolean
  impactedTeeth: number[]
  supernumeraryTeeth: number[]
  congenitallyMissingTeeth: number[]
  
  // Overall severity
  severity: 'mild' | 'moderate' | 'severe'
  complexity: 'low' | 'medium' | 'high'
  
  notes?: string
  recommendations?: string[]
}

interface ClassificationCriteria {
  angleClass: {
    I: string
    II: string
    III: string
  }
  incisorClass: {
    'I': string
    'II-1': string
    'II-2': string
    'III': string
  }
  canineClass: {
    I: string
    II: string
    III: string
  }
}

interface MalocclusionClassificationProps {
  patientId: string
  assessment?: MalocclusionAssessment
  onSave?: (assessment: MalocclusionAssessment) => void
  readonly?: boolean
  showCriteria?: boolean
  className?: string
}

const MalocclusionClassification: React.FC<MalocclusionClassificationProps> = ({
  patientId,
  assessment: initialAssessment,
  onSave,
  readonly = false,
  showCriteria = true,
  className
}) => {
  const [assessment, setAssessment] = useState<MalocclusionAssessment>(
    initialAssessment || {
      id: `assessment-${Date.now()}`,
      patientId,
      assessmentDate: new Date().toISOString().split('T')[0],
      assessedBy: 'current-user',
      angleClass: 'I',
      incisorClass: 'I',
      overjet: 2.5,
      overbite: 2.5,
      canineClassRight: 'I',
      canineClassLeft: 'I',
      anteriorCrossbite: false,
      posteriorCrossbiteRight: false,
      posteriorCrossbiteLeft: false,
      upperArchLength: 0,
      upperTeethWidth: 0,
      upperSpaceAnalysis: 0,
      lowerArchLength: 0,