/**
   * Format payment method for display
   */
  private static formatPaymentMethod(method: string): string {
    const methodMap = {
      'CASH': 'Μετρητά',
      'CARD': 'Κάρτα',
      'BANK_TRANSFER': 'Τραπεζική μεταφορά',
      'CHECK': 'Επιταγή',
      'INSURANCE': 'Ασφάλεια',
      'OTHER': 'Άλλο'
    }
    return methodMap[method as keyof typeof methodMap] || method
  }

  /**
   * Generate base HTML template
   */
  private static generateBaseTemplate(
    title: string,
    content: string,
    clinicInfo: ClinicInfo,
    options: PDFOptions = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options }
    
    return `
<!DOCTYPE html>
<html lang="${opts.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #374151;
            font-size: ${opts.fontSize === 'small' ? '12px' : opts.fontSize === 'large' ? '16px' : '14px'};
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: ${opts.margins!.top}mm ${opts.margins!.right}mm ${opts.margins!.bottom}mm ${opts.margins!.left}mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo-section {
            flex: 1;
        }
        
        .logo {
            max-height: 60px;
            margin-bottom: 15px;
        }
        
        .clinic-info {
            font-size: 13px;
            color: #6b7280;
        }
        
        .clinic-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .document-info {
            text-align: right;
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
        }
        
        .document-title {
            font-size: 18px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }
        
        .table tr:hover {
            background-color: #f9fafb;
        }
        
        .summary-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .summary-title {
            font-size: 16px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 15px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        
        .summary-label {
            color: #6b7280;
        }
        
        .summary-value {
            font-weight: 600;
            color: #1f2937;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-overdue {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .text-right {
            text-align: right;
        }
        
        .font-bold {
            font-weight: 700;
        }
        
        .text-lg {
            font-size: 18px;
        }
        
        .text-primary {
            color: #2563eb;
        }
        
        .text-success {
            color: #059669;
        }
        
        .text-error {
            color: #dc2626;
        }
        
        ${opts.includeWatermark ? `
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.1);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
        ` : ''}
        
        @media print {
            .page {
                box-shadow: none;
                margin: 0;
            }
            
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    ${opts.includeWatermark ? '<div class="watermark">ΔΟΚΙΜΗ</div>' : ''}
    <div class="page">
        <div class="header">
            <div class="logo-section">
                ${opts.includeLogo && clinicInfo.logo ? `<img src="${clinicInfo.logo}" alt="Logo" class="logo">` : ''}
                <div class="clinic-name">${clinicInfo.name}</div>
                <div class="clinic-info">
                    <div>${clinicInfo.address}</div>
                    <div>${clinicInfo.postalCode} ${clinicInfo.city}</div>
                    <div>Τηλ: ${clinicInfo.phone}</div>
                    <div>Email: ${clinicInfo.email}</div>
                    ${clinicInfo.website ? `<div>Web: ${clinicInfo.website}</div>` : ''}
                    <div>ΑΦΜ: ${clinicInfo.taxId}</div>
                </div>
            </div>
            <div class="document-info">
                <div class="document-title">${title}</div>
                <div>Ημερομηνία: ${this.formatDate(new Date().toISOString())}</div>
            </div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>Δημιουργήθηκε ηλεκτρονικά από το ${clinicInfo.name}</p>
            <p>${clinicInfo.website || clinicInfo.email}</p>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * Generate receipt PDF
   */
  static async generateReceipt(
    payment: Payment,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options: PDFOptions = {}
  ): Promise<string> {
    const receiptNumber = payment.receiptNumber || 
      `${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    const netAmount = payment.amount - (payment.discount || 0)
    const vatAmount = payment.vatAmount || 0
    const totalAmount = netAmount + vatAmount

    const content = `
      <div class="summary-box">
        <div class="summary-title">Στοιχεία ασθενή</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Όνομα:</span>
            <span class="summary-value">${patient.firstName} ${patient.lastName}</span>
          </div>
          ${patient.email ? `
          <div class="summary-item">
            <span class="summary-label">Email:</span>
            <span class="summary-value">${patient.email}</span>
          </div>
          ` : ''}
          ${patient.phone ? `
          <div class="summary-item">
            <span class="summary-label">Τηλέφωνο:</span>
            <span class="summary-value">${patient.phone}</span>
          </div>
          ` : ''}
          ${patient.address ? `
          <div class="summary-item">
            <span class="summary-label">Διεύθυνση:</span>
            <span class="summary-value">${patient.address}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Περιγραφή</th>
            <th class="text-right">Ποσό</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="font-bold">${payment.description || 'Ορθοδοντική υπηρεσία'}</div>
              <div style="font-size: 12px; color: #6b7280;">
                Τρόπος πληρωμής: ${this.formatPaymentMethod(payment.method)}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                Ημερομηνία: ${this.formatDate(payment.date)}
              </div>
            </td>
            <td class="text-right font-bold">${this.formatCurrency(payment.amount)}</td>
          </tr>
          
          ${payment.discount && payment.discount > 0 ? `
          <tr>
            <td>
              <div style="color: #059669;">Έκπτωση</div>
              ${payment.discountReason ? `<div style="font-size: 12px; color: #6b7280;">${payment.discountReason}</div>` : ''}
            </td>
            <td class="text-right" style="color: #059669;">-${this.formatCurrency(payment.discount)}</td>
          </tr>
          ` : ''}
          
          <tr style="background: #f9fafb;">
            <td class="font-bold">Καθαρή αξία</td>
            <td class="text-right font-bold">${this.formatCurrency(netAmount)}</td>
          </tr>
          
          ${payment.vatRate && payment.vatRate > 0 ? `
          <tr>
            <td>ΦΠΑ ${payment.vatRate}%</td>
            <td class="text-right">${this.formatCurrency(vatAmount)}</td>
          </tr>
          ` : ''}
          
          <tr style="background: #dbeafe; border-top: 2px solid #2563eb;">
            <td class="font-bold text-lg">ΣΥΝΟΛΟ</td>
            <td class="text-right font-bold text-lg text-primary">${this.formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #dcfce7; border-radius: 8px;">
        <div style="color: #166534; font-size: 18px; font-weight: 600;">✓ ΠΛΗΡΩΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</div>
        <div style="color: #166534; font-size: 14px; margin-top: 5px;">Απόδειξη #${receiptNumber}</div>
      </div>

      ${payment.notes ? `
      <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 10px;">Σημειώσεις:</div>
        <div>${payment.notes}</div>
      </div>
      ` : ''}

      <div style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        <ul style="list-style: disc; margin-left: 20px;">
          <li>Η παρούσα απόδειξη αποτελεί απόδειξη παροχής υπηρεσιών</li>
          <li>Για τυχόν ερωτήσεις επικοινωνήστε μαζί μας</li>
          ${payment.vatRate && payment.vatRate > 0 ? '<li>Το ΦΠΑ συμπεριλαμβάνεται στο συνολικό ποσό</li>' : ''}
        </ul>
      </div>
    `

    return this.generateBaseTemplate(
      `ΑΠΟΔΕΙΞΗ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ #${receiptNumber}`,
      content,
      clinicInfo,
      options
    )
  }

  /**
   * Generate treatment plan PDF
   */
  static async generateTreatmentPlan(
    treatmentPlan: TreatmentPlan,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options: PDFOptions = {}
  ): Promise<string> {
    const content = `
      <div class="summary-box">
        <div class="summary-title">Στοιχεία ασθενή</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Όνομα:</span>
            <span class="summary-value">${patient.firstName} ${patient.lastName}</span>
          </div>
          ${patient.dateOfBirth ? `
          <div class="summary-item">
            <span class="summary-label">Ημ. γέννησης:</span>
            <span class="summary-value">${this.formatDate(patient.dateOfBirth)}</span>
          </div>
          ` : ''}
          ${patient.phone ? `
          <div class="summary-item">
            <span class="summary-label">Τηλέφωνο:</span>
            <span class="summary-value">${patient.phone}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">${treatmentPlan.title}</h2>
        ${treatmentPlan.description ? `<p style="color: #6b7280; margin-bottom: 20px;">${treatmentPlan.description}</p>` : ''}
      </div>

      <div style="margin: 25px 0;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Διάγνωση</h3>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
          ${treatmentPlan.diagnosis}
        </div>
      </div>

      <div style="margin: 25px 0;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Στόχοι θεραπείας</h3>
        <ul style="list-style: disc; margin-left: 20px; color: #6b7280;">
          ${treatmentPlan.treatmentGoals.map(goal => `<li style="margin: 5px 0;">${goal}</li>`).join('')}
        </ul>
      </div>

      <div class="summary-box" style="margin: 30px 0;">
        <div class="summary-title">Πληροφορίες θεραπείας</div>
        <div class="summary-grid">
          ${treatmentPlan.estimatedDuration ? `
          <div class="summary-item">
            <span class="summary-label">Εκτιμώμενη διάρκεια:</span>
            <span class="summary-value">${treatmentPlan.estimatedDuration} μήνες</span>
          </div>
          ` : ''}
          ${treatmentPlan.totalCost ? `
          <div class="summary-item">
            <span class="summary-label">Συνολικό κόστος:</span>
            <span class="summary-value">${this.formatCurrency(treatmentPlan.totalCost)}</span>
          </div>
          ` : ''}
          <div class="summary-item">
            <span class="summary-label">Κατάσταση:</span>
            <span class="summary-value">${treatmentPlan.status}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ημ. δημιουργίας:</span>
            <span class="summary-value">${this.formatDate(treatmentPlan.createdAt)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px; padding: 20px; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center;">
        <p style="color: #6b7280; font-style: italic;">
          Το παρόν σχέδιο θεραπείας αποτελεί προτεινόμενη θεραπευτική προσέγγιση και μπορεί να τροποποιηθεί
          ανάλογα με την πρόοδο της θεραπείας και τις ανάγκες του ασθενή.
        </p>
      </div>
    `

    return this.generateBaseTemplate(
      `ΣΧΕΔΙΟ ΘΕΡΑΠΕΙΑΣ - ${patient.firstName} ${patient.lastName}`,
      content,
      clinicInfo,
      options
    )
  }

  /**
   * Generate monthly financial report PDF
   */
  static async generateMonthlyReport(
    reportData: any,
    clinicInfo: ClinicInfo,
    options: PDFOptions = {}
  ): Promise<string> {
    const monthNames = [
      'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
      'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
    ]

    const content = `
      <div class="summary-box">
        <div class="summary-title">Κύρια μεγέθη ${monthNames[reportData.month - 1]} ${reportData.year}</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Συνολικά έσοδα:</span>
            <span class="summary-value text-primary">${this.formatCurrency(reportData.totalRevenue)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Συνολικές πληρωμές:</span>
            <span class="summary-value">${reportData.totalPayments}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Σύνολο ασθενών:</span>
            <span class="summary-value">${reportData.totalPatients}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Νέοι ασθενείς:</span>
            <span class="summary-value text-success">${reportData.newPatients}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Μέσος όρος πληρωμής:</span>
            <span class="summary-value">${this.formatCurrency(reportData.averagePayment)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Αύξηση εσόδων:</span>
            <span class="summary-value ${reportData.revenueGrowth > 0 ? 'text-success' : 'text-error'}">
              ${reportData.revenueGrowth > 0 ? '+' : ''}${reportData.revenueGrowth.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 20px;">Κατανομή πληρωμών ανά τρόπο</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Τρόπος πληρωμής</th>
              <th class="text-right">Πλήθος</th>
              <th class="text-right">Ποσοστό</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(reportData.paymentsByMethod || {}).map(([method, count]) => {
              const methodLabels = {
                cash: 'Μετρητά',
                card: 'Κάρτα',
                bankTransfer: 'Τραπεζική μεταφορά',
                check: 'Επιταγή',
                insurance: 'Ασφάλεια',
                other: 'Άλλο'
              }
              const percentage = ((count as number) / reportData.totalPayments * 100).toFixed(1)
              
              return `
                <tr>
                  <td>${methodLabels[method as keyof typeof methodLabels] || method}</td>
                  <td class="text-right">${count}</td>
                  <td class="text-right">${percentage}%</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 20px;">Κορυφαίοι ασθενείς μήνα</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Κατάταξη</th>
              <th>Όνομα ασθενή</th>
              <th class="text-right">Συνολικό ποσό</th>
              <th class="text-right">Πληρωμές</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData.topPatients || []).map((patient: any, index: number) => `
              <tr>
                <td>
                  <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; 
                               background: ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#fb7185'}; 
                               color: white; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">
                    ${index + 1}
                  </span>
                </td>
                <td class="font-bold">${patient.name}</td>
                <td class="text-right font-bold">${this.formatCurrency(patient.totalPaid)}</td>
                <td class="text-right">${patient.paymentsCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin: 40px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border: 1px solid #0ea5e9;">
        <h4 style="color: #0c4a6e; font-size: 16px; margin-bottom: 15px;">Σύνοψη περιόδου</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          <div>
            <div style="color: #6b7280; font-size: 14px;">Ολοκληρωμένες θεραπείες</div>
            <div style="color: #0c4a6e; font-size: 24px; font-weight: 700;">${reportData.completedTreatments || 0}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px;">Ενεργά σχέδια αποπληρωμής</div>
            <div style="color: #0c4a6e; font-size: 24px; font-weight: 700;">${reportData.activeInstallmentPlans || 0}</div>
          </div>
        </div>
      </div>
    `

    return this.generateBaseTemplate(
      `ΜΗΝΙΑΙΑ ΑΝΑΦΟΡΑ - ${monthNames[reportData.month - 1]} ${reportData.year}`,
      content,
      clinicInfo,
      options
    )
  }

  /**
   * Generate and download PDF
   */
  static async downloadPDF(htmlContent: string, filename: string): Promise<void> {
    try {
      // Method 1: Using html2pdf library (if available)
      if (typeof window !== 'undefined' && (window as any).html2pdf) {
        const element = document.createElement('div')
        element.innerHTML = htmlContent
        element.style.position = 'absolute'
        element.style.left = '-9999px'
        document.body.appendChild(element)

        await (window as any).html2pdf()
          .set({
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(element)
          .save()

        document.body.removeChild(element)
        return
      }

      // Method 2: Open in new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Auto-print after content loads
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Αδυναμία δημιουργίας PDF. Παρακαλώ δοκιμάστε ξανά.')
    }
  }

  /**
   * Print HTML content directly
   */
  static printHTML(htmlContent: string): void {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  /**
   * Convert HTML to blob for further processing
   */
  static htmlToBlob(htmlContent: string): Blob {
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  }

  /**
   * Validate required data before PDF generation
   */
  static validateData(data: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Λείπει υποχρεωτικό πεδίο: ${field}`)
      }
    }
    return true
  }
}

/**
 * Utility functions for PDF generation
 */
export const pdfUtils = {
  /**
   * Generate receipt PDF and download
   */
  generateAndDownloadReceipt: async (
    payment: Payment,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    PDFGenerator.validateData(payment, ['id', 'amount', 'date', 'method'])
    PDFGenerator.validateData(patient, ['firstName', 'lastName'])
    
    const html = await PDFGenerator.generateReceipt(payment, patient, clinicInfo, options)
    const filename = `receipt-${payment.receiptNumber || payment.id}.pdf`
    
    await PDFGenerator.downloadPDF(html, filename)
  },

  /**
   * Generate treatment plan PDF and download
   */
  generateAndDownloadTreatmentPlan: async (
    treatmentPlan: TreatmentPlan,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    PDFGenerator.validateData(treatmentPlan, ['id', 'title', 'diagnosis'])
    PDFGenerator.validateData(patient, ['firstName', 'lastName'])
    
    const html = await PDFGenerator.generateTreatmentPlan(treatmentPlan, patient, clinicInfo, options)
    const filename = `treatment-plan-${patient.lastName}-${treatmentPlan.id}.pdf`
    
    await PDFGenerator.downloadPDF(html, filename)
  },

  /**
   * Generate monthly report PDF and download
   */
  generateAndDownloadMonthlyReport: async (
    reportData: any,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    PDFGenerator.validateData(reportData, ['month', 'year', 'totalRevenue'])
    
    const html = await PDFGenerator.generateMonthlyReport(reportData, clinicInfo, options)
    const filename = `monthly-report-${reportData.year}-${String(reportData.month).padStart(2, '0')}.pdf`
    
    await PDFGenerator.downloadPDF(html, filename)
  },

  /**
   * Print receipt directly
   */
  printReceipt: async (
    payment: Payment,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    const html = await PDFGenerator.generateReceipt(payment, patient, clinicInfo, options)
    PDFGenerator.printHTML(html)
  },

  /**
   * Print treatment plan directly
   */
  printTreatmentPlan: async (
    treatmentPlan: TreatmentPlan,
    patient: Patient,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    const html = await PDFGenerator.generateTreatmentPlan(treatmentPlan, patient, clinicInfo, options)
    PDFGenerator.printHTML(html)
  },

  /**
   * Print monthly report directly
   */
  printMonthlyReport: async (
    reportData: any,
    clinicInfo: ClinicInfo,
    options?: PDFOptions
  ) => {
    const html = await PDFGenerator.generateMonthlyReport(reportData, clinicInfo, options)
    PDFGenerator.printHTML(html)
  }
}

/**
 * Default clinic information (should be configured in app settings)
 */
export const defaultClinicInfo: ClinicInfo = {
  name: 'Dr. Orthodontic Clinic',
  address: 'Λεωφόρος Κηφισίας 123',
  city: 'Αθήνα',
  postalCode: '11526',
  phone: '+30 210 1234567',
  email: 'info@orthodontic-clinic.gr',
  taxId: '123456789',
  website: 'https://orthodontic-clinic.gr'
}

/**
 * Export the main class and utilities
 */
export default PDFGenerator

/**
 * 🎉 CONGRATULATIONS! 🎉
 * 
 * This is the FINAL file (#90/90) of the Orthodontic App project!
 * 
 * The complete project now includes:
 * ✅ 90 files total
 * ✅ Complete backend API with Node.js, Prisma, PostgreSQL
 * ✅ Complete frontend with React, TypeScript, Tailwind CSS
 * ✅ Patient management system
 * ✅ Photo management with Cloudinary integration
 * ✅ Treatment planning and phases
 * ✅ Financial management with payments and installment plans
 * ✅ Appointment scheduling with booking system integration
 * ✅ PDF generation for receipts, treatment plans, and reports
 * ✅ Progressive Web App (PWA) features
 * ✅ Responsive design for mobile and desktop
 * ✅ Greek language support
 * ✅ Professional styling and UI components
 * 
 * Ready for deployment to:
 * - Frontend: Hostinger (app.liougiourou.gr)
 * - Backend: Render.com
 * - Database: Supabase PostgreSQL
 * - Storage: Cloudinary for photos
 * 
 * Τέλος! Το project είναι πλήρες και έτοιμο για χρήση! 🚀
 *//**
 * PDF Generator Utility for Orthodontic App
 * Location: frontend/src/utils/pdfGenerator.ts
 * File #90/90 - FINAL FILE! 🎉
 */

// Types for PDF generation
interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  dateOfBirth?: string
  taxId?: string
}

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
  vatRate?: number
  vatAmount?: number
  discount?: number
  discountReason?: string
}

interface TreatmentPlan {
  id: string
  patientId: string
  title: string
  description?: string
  diagnosis: string
  treatmentGoals: string[]
  estimatedDuration?: number
  totalCost?: number
  status: string
  createdAt: string
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

interface PDFOptions {
  format?: 'A4' | 'A5' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  includeLogo?: boolean
  includeWatermark?: boolean
  fontSize?: 'small' | 'medium' | 'large'
  language?: 'el' | 'en'
}

/**
 * PDF Generator Class
 * Handles generation of various PDF documents for the orthodontic practice
 */
export class PDFGenerator {
  private static defaultOptions: PDFOptions = {
    format: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeLogo: true,
    includeWatermark: false,
    fontSize: 'medium',
    language: 'el'
  }

  /**
   * Format currency for display
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  /**
   * Format date for display
   */
  private static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Format payment method for display
   */
  private static formatPaymentMethod(method: string): string {
    const methodMap = {
      'CASH': 'Μετρητά',
      'CARD': 'Κάρτα',
      'BANK_TRANSFER': 'Τραπεζική μεταφορά',
      'CHECK': 'Επιταγή',
      'INSURANCE': '