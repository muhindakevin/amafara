import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, CreditCard, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'
import jsPDF from 'jspdf'

function LoanPaymentModal({ loan, onClose, onSuccess }) {
  const { t } = useTranslation('forms')
  const { t: tCommon } = useTranslation('common')
  const { t: tDashboard } = useTranslation('dashboard')
  const [paymentFrequency, setPaymentFrequency] = useState('monthly') // monthly, weekly, quarterly
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Initialize amount with monthly payment when modal opens
  useEffect(() => {
    if (loan && loan.monthlyPayment && !amount) {
      setAmount(loan.monthlyPayment.toString())
    }
  }, [loan])

  // Calculate payment amount based on frequency (for quick payment buttons)
  const calculatePaymentAmount = () => {
    const monthlyPayment = parseFloat(loan.monthlyPayment || 0)
    
    switch (paymentFrequency) {
      case 'weekly':
        return Math.round(monthlyPayment / 4) // Approximate weekly payment
      case 'quarterly':
        return Math.round(monthlyPayment * 3) // Quarterly payment
      case 'monthly':
      default:
        return monthlyPayment
    }
  }

  const paymentAmount = calculatePaymentAmount()
  const remainingBalance = parseFloat(loan.remainingBalance || loan.remainingAmount || 0)
  const canPayFull = paymentAmount >= remainingBalance

  // Calculate remaining balance after payment
  const calculateRemainingAfterPayment = () => {
    // Use amount from input if available, otherwise use frequency-based amount
    const payment = amount ? parseFloat(amount) : paymentAmount
    if (!payment || isNaN(payment) || payment <= 0) {
      return remainingBalance
    }
    return Math.max(0, remainingBalance - payment)
  }

  const remainingAfterPayment = calculateRemainingAfterPayment()
  const currentPaymentAmount = amount ? parseFloat(amount) : paymentAmount
  const willFullyPay = remainingAfterPayment <= 0 && currentPaymentAmount > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Get the final amount - prioritize custom amount if entered, otherwise use frequency-based amount
    let finalAmount = 0
    
    // Check if user entered a custom amount
    if (amount && amount.trim() !== '') {
      finalAmount = parseFloat(amount)
    } else if (paymentAmount > 0) {
      // Use frequency-based amount
      finalAmount = paymentAmount
    } else {
      alert(t('enterPaymentAmount', { defaultValue: 'Please enter a payment amount' }))
      return
    }
    
    // Validate the amount
    if (isNaN(finalAmount) || !isFinite(finalAmount)) {
      alert(t('enterValidPaymentAmount', { defaultValue: 'Please enter a valid payment amount' }))
      return
    }
    
    if (finalAmount <= 0) {
      alert(t('paymentAmountGreaterThanZero', { defaultValue: 'Payment amount must be greater than zero' }))
      return
    }

    if (finalAmount > remainingBalance) {
      alert(t('paymentExceedsBalance', { 
        defaultValue: 'Payment amount cannot exceed remaining balance of {{balance}} RWF',
        balance: remainingBalance.toLocaleString()
      }))
      return
    }

    // Round to 2 decimal places to avoid floating point issues
    finalAmount = Math.round(finalAmount * 100) / 100

    setProcessing(true)
    try {
      console.log('[LoanPaymentModal] Submitting payment:', {
        loanId: loan.id,
        amount: finalAmount,
        amountType: typeof finalAmount,
        paymentMethod: paymentMethod,
        loanStatus: loan.status,
        remainingBalance: remainingBalance,
        loanRemainingAmount: loan.remainingAmount || loan.remainingBalance
      })

      // Ensure amount is sent as a number, not string
      const response = await api.post(`/loans/${loan.id}/pay`, {
        amount: Number(finalAmount),
        paymentMethod: paymentMethod || 'cash'
      })

      if (response.data?.success) {
        const paymentData = response.data.data || response.data
        
        // Generate PDF receipt
        generatePDFReceipt({
          loanId: loan.id,
          amount: finalAmount,
          paymentMethod: paymentMethod,
          remainingBalance: paymentData.remainingAmount || (remainingBalance - finalAmount),
          loanPurpose: loan.purpose,
          memberName: response.data.memberName || 'Member',
          groupName: response.data.groupName || 'Group',
          receiptNumber: `LOAN-${loan.id}-${Date.now()}`,
          date: new Date().toLocaleString()
        })

        alert(t('paymentProcessedSuccessfully', { defaultValue: 'Payment processed successfully! Receipt has been downloaded.' }))
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process payment. Please try again.'
      const errorDetails = error.response?.data || {}
      console.error('[LoanPaymentModal] Payment failed:', {
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        loanStatus: loan.status,
        amount: finalAmount,
        remainingBalance: remainingBalance
      })
      
      // Show more detailed error message
      let userMessage = errorMessage
      if (error.response?.status === 400 && loan.status && 
          !['active', 'disbursed', 'approved'].includes(loan.status)) {
        userMessage = `Cannot make payment. Loan status is "${loan.status}". The loan must be approved and disbursed before payments can be made.`
      }
      
      alert(userMessage)
    } finally {
      setProcessing(false)
    }
  }

  const generatePDFReceipt = (paymentData) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      // Blue color: #1E88E5
      const blueColor = [30, 136, 229]
      const lightBlue = [227, 242, 253]
      
      // Header with blue background
      doc.setFillColor(...blueColor)
      doc.roundedRect(margin, margin, contentWidth, 35, 3, 3, 'F')
      
      // White text on blue background
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('IKIMINA WALLET', pageWidth / 2, margin + 15, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('Loan Payment Receipt', pageWidth / 2, margin + 25, { align: 'center' })
      
      let yPos = margin + 50
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0)
      
      // Receipt details section with light blue background
      doc.setFillColor(...lightBlue)
      doc.roundedRect(margin, yPos, contentWidth, 120, 3, 3, 'F')
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Payment Details', margin + 10, yPos)
      
      yPos += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Loan ID
      doc.setFont('helvetica', 'bold')
      doc.text('Loan ID:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`#${paymentData.loanId}`, margin + 40, yPos)
      yPos += 7
      
      // Payer Name
      doc.setFont('helvetica', 'bold')
      doc.text('Payer:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(paymentData.memberName || 'Member', margin + 40, yPos)
      yPos += 7
      
      // Loan Purpose
      doc.setFont('helvetica', 'bold')
      doc.text('Purpose:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(paymentData.loanPurpose || 'N/A', margin + 40, yPos)
      yPos += 7
      
      // Payment Amount
      doc.setFont('helvetica', 'bold')
      doc.text('Payment Amount:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const amountText = `${Number(paymentData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
      doc.text(amountText, margin + 50, yPos)
      yPos += 7
      
      // Payment Method
      doc.setFont('helvetica', 'bold')
      doc.text('Payment Method:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const methodMap = {
        'cash': 'Cash',
        'mtn_mobile_money': 'MTN Mobile Money',
        'airtel_money': 'Airtel Money',
        'bank_transfer': 'Bank Transfer'
      }
      doc.text(methodMap[paymentData.paymentMethod] || paymentData.paymentMethod || 'Cash', margin + 50, yPos)
      yPos += 7
      
      // Remaining Balance
      doc.setFont('helvetica', 'bold')
      doc.text('Remaining Balance:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const remainingText = `${Number(paymentData.remainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
      doc.text(remainingText, margin + 50, yPos)
      yPos += 7
      
      // Receipt Number
      if (paymentData.receiptNumber) {
        doc.setFont('helvetica', 'bold')
        doc.text('Receipt Number:', margin + 10, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setFont('courier', 'normal')
        doc.text(paymentData.receiptNumber, margin + 50, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 7
      }
      
      // Date & Time
      doc.setFont('helvetica', 'bold')
      doc.text('Date & Time:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(paymentData.date || new Date().toLocaleString(), margin + 45, yPos)
      yPos += 7
      
      // Payment Status
      doc.setFont('helvetica', 'bold')
      doc.text('Status:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const isFullyPaid = paymentData.remainingBalance <= 0
      if (isFullyPaid) {
        doc.setTextColor(0, 128, 0)
      } else {
        doc.setTextColor(0, 0, 0)
      }
      doc.text(isFullyPaid ? 'Fully Paid' : 'Partially Paid', margin + 40, yPos)
      doc.setTextColor(0, 0, 0)
      
      yPos += 15
      
      // Thank you message with blue text
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...blueColor)
      doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 10
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.setFont('helvetica', 'normal')
      doc.text('This is an official receipt from IKIMINA WALLET', pageWidth / 2, pageHeight - 15, { align: 'center' })
      doc.text('For inquiries, please contact your group administrator', pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      // Generate filename
      const receiptNum = paymentData.receiptNumber || `LOAN-${paymentData.loanId}-${Date.now()}`
      const filename = `Loan_Payment_Receipt_${receiptNum}.pdf`
      
      // Save PDF
      doc.save(filename)
      
      console.log(`[LoanPaymentModal] PDF receipt generated: ${filename}`)
      return true
    } catch (error) {
      console.error('[LoanPaymentModal] Error generating PDF receipt:', error)
      return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tDashboard('makePayment')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Loan Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('loanDetails')}</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{t('purpose')}:</span>
              <span className="font-semibold text-gray-800 dark:text-white">{loan.purpose}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{t('remaining', { defaultValue: 'Remaining' })}:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{remainingBalance.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{t('monthly', { defaultValue: 'Monthly' })}:</span>
              <span className="font-semibold dark:text-white">{loan.monthlyPayment?.toLocaleString() || '0'} RWF</span>
            </div>
          </div>

          {/* Amount to Pay - Primary Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('amountToPay', { defaultValue: 'Amount to Pay' })} (RWF)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setAmount(value)
                  if (value && value.trim() !== '') {
                    setCustomAmount(true)
                  }
                }}
                onFocus={() => {
                  // If empty and we have a payment amount, pre-fill it
                  if (!amount && paymentAmount > 0) {
                    setAmount(paymentAmount.toString())
                    setCustomAmount(true)
                  }
                }}
                placeholder={t('enterAmount', { defaultValue: 'Enter amount' })}
                className="input-field pl-10 text-base font-semibold py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                min="1"
                max={remainingBalance}
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('max', { defaultValue: 'Max' })}: {remainingBalance.toLocaleString()} RWF
              </p>
            </div>
          </div>

          {/* Quick Payment Options */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('quickOptions', { defaultValue: 'Quick Options' })}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const weeklyAmount = Math.round(loan.monthlyPayment / 4)
                  setPaymentFrequency('weekly')
                  setAmount(weeklyAmount.toString())
                  setCustomAmount(true)
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  paymentFrequency === 'weekly'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar size={16} className="mx-auto mb-0.5" />
                <p className="text-xs font-semibold">{t('weekly', { defaultValue: 'Weekly' })}</p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">{(loan.monthlyPayment / 4).toFixed(0)} RWF</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const monthlyAmount = loan.monthlyPayment || 0
                  setPaymentFrequency('monthly')
                  setAmount(monthlyAmount.toString())
                  setCustomAmount(true)
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  paymentFrequency === 'monthly'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar size={16} className="mx-auto mb-0.5" />
                <p className="text-xs font-semibold">{t('monthly', { defaultValue: 'Monthly' })}</p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">{loan.monthlyPayment?.toLocaleString() || '0'} RWF</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const quarterlyAmount = Math.round(loan.monthlyPayment * 3)
                  setPaymentFrequency('quarterly')
                  setAmount(quarterlyAmount.toString())
                  setCustomAmount(true)
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  paymentFrequency === 'quarterly'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar size={16} className="mx-auto mb-0.5" />
                <p className="text-xs font-semibold">{t('quarterly', { defaultValue: 'Quarterly' })}</p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">{(loan.monthlyPayment * 3).toLocaleString() || '0'} RWF</p>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setAmount(remainingBalance.toString())
                setCustomAmount(true)
              }}
              className="mt-1.5 w-full p-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200 transition-colors"
            >
              {t('payFull', { defaultValue: 'Pay Full' })} ({remainingBalance.toLocaleString()} RWF)
            </button>
          </div>

          {/* Payment Summary - Shows Remaining Balance Calculation */}
          {currentPaymentAmount > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 space-y-2 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('paymentSummary', { defaultValue: 'Payment Summary' })}</p>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{t('remaining', { defaultValue: 'Remaining' })}:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{remainingBalance.toLocaleString()} RWF</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{t('payment', { defaultValue: 'Payment' })}:</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {currentPaymentAmount.toLocaleString()} RWF
                </span>
              </div>

              <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t('afterPayment', { defaultValue: 'After Payment' })}:</span>
                  <span className={`text-sm font-bold ${willFullyPay ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {remainingAfterPayment.toLocaleString()} RWF
                  </span>
                </div>
              </div>

              {willFullyPay && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-300 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    <span className="font-semibold">{t('willFullySettle', { defaultValue: 'Will fully settle your loan!' })}</span>
                  </p>
                </div>
              )}

              {!willFullyPay && remainingAfterPayment > 0 && (
                <div className="mt-1.5 p-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-[10px] text-yellow-800 dark:text-yellow-300">
                    <strong>{remainingAfterPayment.toLocaleString()} RWF</strong> {t('willRemainAfterPayment', { defaultValue: 'will remain after payment.' })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('paymentMethod', { defaultValue: 'Payment Method' })}
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field pl-10 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                required
              >
                <option value="cash">{t('cash', { defaultValue: 'Cash' })}</option>
                <option value="mtn_mobile_money">{t('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' })}</option>
                <option value="airtel_money">{t('airtelMoney', { defaultValue: 'Airtel Money' })}</option>
                <option value="bank_transfer">{t('bankTransfer', { defaultValue: 'Bank Transfer' })}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2 text-sm"
              disabled={processing}
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 text-sm"
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('processing', { defaultValue: 'Processing...' })}
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  {t('pay', { defaultValue: 'Pay' })} {currentPaymentAmount.toLocaleString()} RWF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoanPaymentModal

