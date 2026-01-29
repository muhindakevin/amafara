import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

/**
 * PDF Export Utility with Blue and White Theme
 * Creates professional PDF reports with IKIMINA WALLET branding
 * Also includes Excel export functionality
 */

const PRIMARY_COLOR = [30, 64, 175] // Blue: #1e40af
const SECONDARY_COLOR = [59, 130, 246] // Light Blue: #3b82f6
const TEXT_COLOR = [31, 41, 55] // Gray-800
const LIGHT_GRAY = [243, 244, 246] // Gray-100

/**
 * Create a new PDF document with header
 */
export const createPDFDocument = (title, subtitle = '') => {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Header with blue background
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  // Logo/Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('IKIMINA WALLET', pageWidth / 2, 12, { align: 'center' })
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, pageWidth / 2, 20, { align: 'center' })
  }
  
  // Report Title
  doc.setTextColor(...TEXT_COLOR)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 40, { align: 'center' })
  
  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128) // Gray-500
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 47, { align: 'center' })
  
  return { doc, pageWidth, pageHeight }
}

/**
 * Add a table to the PDF (legacy function - kept for backward compatibility)
 */
export const addTable = (doc, data, startY, pageWidth, options = {}) => {
  return addFormattedTable(doc, data, startY, pageWidth, options)
}

/**
 * Add a formatted table to the PDF - Google Forms style with borders and grid lines
 * This creates a table that looks exactly like Excel/Google Forms with proper borders
 */
export const addFormattedTable = (doc, data, startY, pageWidth, options = {}) => {
  const {
    headers = [],
    rows = [],
    columnWidths = [],
    headerColor = PRIMARY_COLOR,
    rowColor = LIGHT_GRAY,
    fontSize = 9,
    cellPadding = 3,
    rowHeight = null // Auto-calculate based on content
  } = options
  
  let currentY = startY
  const margin = 15
  const tableWidth = pageWidth - (margin * 2)
  const borderColor = [200, 200, 200] // Light gray for borders
  const borderWidth = 0.2
  
  // Calculate column widths if not provided
  const cols = headers.length
  const defaultColWidth = tableWidth / cols
  const widths = columnWidths.length === cols 
    ? columnWidths.map(w => w * tableWidth / 100)
    : Array(cols).fill(defaultColWidth)
  
  // Helper function to draw cell borders
  const drawCellBorders = (x, y, width, height) => {
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(borderWidth)
    // Top border
    doc.line(x, y, x + width, y)
    // Bottom border
    doc.line(x, y + height, x + width, y + height)
    // Left border
    doc.line(x, y, x, y + height)
    // Right border
    doc.line(x + width, y, x + width, y + height)
  }
  
  // Helper function to calculate row height based on content
  const calculateRowHeight = (row) => {
    let maxLines = 1
    row.forEach((cell, colIndex) => {
      const cellText = String(cell || '')
      const maxWidth = widths[colIndex] - (cellPadding * 2)
      const lines = doc.splitTextToSize(cellText, maxWidth)
      maxLines = Math.max(maxLines, lines.length)
    })
    return Math.max(8, maxLines * (fontSize * 0.4) + (cellPadding * 2))
  }
  
  // Draw header row with borders
  const headerHeight = 10
  doc.setFillColor(...headerColor)
  doc.rect(margin, currentY, tableWidth, headerHeight, 'F')
  
  // Draw header borders
  let xPos = margin
  headers.forEach((header, i) => {
    drawCellBorders(xPos, currentY, widths[i], headerHeight)
    xPos += widths[i]
  })
  
  // Draw header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  xPos = margin
  headers.forEach((header, i) => {
    const headerText = doc.splitTextToSize(String(header), widths[i] - (cellPadding * 2))
    doc.text(headerText, xPos + cellPadding, currentY + headerHeight / 2 + (fontSize * 0.3), {
      align: 'left',
      maxWidth: widths[i] - (cellPadding * 2)
    })
    xPos += widths[i]
  })
  
  currentY += headerHeight
  
  // Data rows with borders and grid lines
  doc.setTextColor(...TEXT_COLOR)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  
  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    const estimatedRowHeight = rowHeight || calculateRowHeight(row)
    if (currentY + estimatedRowHeight > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      currentY = 20
      
      // Redraw header on new page
      doc.setFillColor(...headerColor)
      doc.rect(margin, currentY, tableWidth, headerHeight, 'F')
      
      // Draw header borders
      xPos = margin
      headers.forEach((header, i) => {
        drawCellBorders(xPos, currentY, widths[i], headerHeight)
        xPos += widths[i]
      })
      
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      xPos = margin
      headers.forEach((header, i) => {
        const headerText = doc.splitTextToSize(String(header), widths[i] - (cellPadding * 2))
        doc.text(headerText, xPos + cellPadding, currentY + headerHeight / 2 + (fontSize * 0.3), {
          align: 'left',
          maxWidth: widths[i] - (cellPadding * 2)
        })
        xPos += widths[i]
      })
      currentY += headerHeight
      doc.setTextColor(...TEXT_COLOR)
      doc.setFont('helvetica', 'normal')
    }
    
    // Calculate actual row height for this row
    const actualRowHeight = rowHeight || calculateRowHeight(row)
    
    // Alternate row background color (subtle)
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...rowColor)
      doc.rect(margin, currentY, tableWidth, actualRowHeight, 'F')
    }
    
    // Draw cell borders and content
    xPos = margin
    row.forEach((cell, colIndex) => {
      const cellText = String(cell || '')
      const maxWidth = widths[colIndex] - (cellPadding * 2)
      
      // Draw cell borders
      drawCellBorders(xPos, currentY, widths[colIndex], actualRowHeight)
      
      // Split text to fit in cell (auto-wrap)
      const textLines = doc.splitTextToSize(cellText, maxWidth)
      
      // Draw text with proper vertical alignment (top-aligned for multi-line)
      const lineHeight = fontSize * 0.4
      const startY = currentY + cellPadding + (fontSize * 0.3)
      textLines.forEach((line, lineIndex) => {
        doc.text(line, xPos + cellPadding, startY + (lineIndex * lineHeight), {
          align: 'left',
          maxWidth: maxWidth
        })
      })
      
      xPos += widths[colIndex]
    })
    
    currentY += actualRowHeight
  })
  
  // Draw outer table border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(borderWidth * 2)
  doc.rect(margin, startY, tableWidth, currentY - startY, 'S')
  
  return currentY
}

/**
 * Add summary cards/sections
 */
export const addSummarySection = (doc, summaries, startY, pageWidth) => {
  const margin = 15
  const cardWidth = (pageWidth - (margin * 2) - 10) / summaries.length
  let currentY = startY
  
  summaries.forEach((summary, index) => {
    const xPos = margin + (index * (cardWidth + 5))
    
    // Card background
    doc.setFillColor(...LIGHT_GRAY)
    doc.rect(xPos, currentY, cardWidth, 25, 'F')
    
    // Border
    doc.setDrawColor(...SECONDARY_COLOR)
    doc.setLineWidth(0.5)
    doc.rect(xPos, currentY, cardWidth, 25, 'S')
    
    // Label
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128) // Gray-500
    doc.text(summary.label, xPos + 5, currentY + 8)
    
    // Value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY_COLOR)
    const valueText = String(summary.value)
    const valueY = currentY + 18
    doc.text(valueText, xPos + 5, valueY)
  })
  
  return currentY + 30
}

/**
 * Add footer to PDF
 */
export const addFooter = (doc, pageWidth, pageHeight, pageNumber, totalPages) => {
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175) // Gray-400
  doc.setFont('helvetica', 'normal')
  
  // Footer line
  doc.setDrawColor(229, 231, 235) // Gray-200
  doc.setLineWidth(0.5)
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
  
  // Footer text
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  doc.text(
    'This is an official report from IKIMINA WALLET',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
}

/**
 * Save PDF with proper filename
 */
export const savePDF = (doc, filename) => {
  const dateStr = new Date().toISOString().split('T')[0]
  const finalFilename = `${filename}_${dateStr}.pdf`
  doc.save(finalFilename)
  console.log(`[PDF Export] Report saved: ${finalFilename}`)
}

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'RWF') => {
  return `${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

/**
 * Format date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date and time for table display (full format)
 */
export const formatDateTimeFull = (date, time = null) => {
  if (!date) return 'N/A'
  const dateObj = new Date(date)
  const dateStr = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  if (time) {
    return `${dateStr} ${time}`
  }
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  return `${dateStr} ${timeStr}`
}

/**
 * Export data to Excel
 * @param {Array} data - Array of transaction objects
 * @param {Array} headers - Column headers
 * @param {String} filename - Output filename
 * @param {Object} options - Additional options (title, groupName, summary, etc.)
 */
export const exportToExcel = (data, headers, filename, options = {}) => {
  try {
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet data
    const worksheetData = []
    
    // Add title row
    if (options.title) {
      worksheetData.push([options.title])
      worksheetData.push([])
    }
    
    // Add group name if provided
    if (options.groupName) {
      worksheetData.push(['Group:', options.groupName])
    }
    
    // Add date range if provided
    if (options.dateRange) {
      if (options.dateRange.startDate && options.dateRange.endDate) {
        worksheetData.push(['Date Range:', `${options.dateRange.startDate} to ${options.dateRange.endDate}`])
      } else if (options.dateRange.startDate) {
        worksheetData.push(['From Date:', options.dateRange.startDate])
      } else if (options.dateRange.endDate) {
        worksheetData.push(['To Date:', options.dateRange.endDate])
      }
      worksheetData.push(['Generated:', new Date().toLocaleString()])
      worksheetData.push([])
    }
    
    // Add summary if provided
    if (options.summary) {
      worksheetData.push(['SUMMARY'])
      worksheetData.push(['Total Transactions:', options.summary.totalTransactions || 0])
      worksheetData.push(['Total Amount:', formatCurrency(options.summary.totalAmount || 0)])
      if (options.summary.byType) {
        worksheetData.push([])
        worksheetData.push(['Transaction Type Breakdown:'])
        Object.keys(options.summary.byType).forEach(type => {
          const typeInfo = options.summary.byType[type]
          worksheetData.push([`  ${type}:`, `Count: ${typeInfo.count || 0}`, `Amount: ${formatCurrency(typeInfo.totalAmount || 0)}`])
        })
      }
      worksheetData.push([])
    }
    
    // Add headers
    worksheetData.push(headers)
    
    // Add data rows
    data.forEach(row => {
      worksheetData.push(row)
    })
    
    // Add totals row if summary provided
    if (options.summary && data.length > 0) {
      worksheetData.push([])
      worksheetData.push(['TOTAL', '', '', '', '', '', formatCurrency(options.summary.totalAmount || 0)])
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    const colWidths = headers.map((_, index) => {
      const maxLength = Math.max(
        ...worksheetData.map(row => {
          const cell = row[index]
          return cell ? String(cell).length : 0
        })
      )
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
    })
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Report')
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${dateStr}.xlsx`
    
    // Save file
    XLSX.writeFile(workbook, finalFilename)
    console.log(`[Excel Export] Report saved: ${finalFilename}`)
  } catch (error) {
    console.error('[Excel Export] Error:', error)
    throw error
  }
}

/**
 * Export data to CSV
 * @param {Array} data - Array of transaction rows (arrays)
 * @param {Array} headers - Column headers
 * @param {String} filename - Output filename
 * @param {Object} options - Additional options (title, groupName, summary, etc.)
 */
export const exportToCSV = (data, headers, filename, options = {}) => {
  try {
    let csvContent = ''
    
    // Add title if provided
    if (options.title) {
      csvContent += `"${options.title}"\n`
      csvContent += '\n'
    }
    
    // Add group name if provided
    if (options.groupName) {
      csvContent += `"Group:","${options.groupName}"\n`
    }
    
    // Add date range if provided
    if (options.dateRange) {
      if (options.dateRange.startDate && options.dateRange.endDate) {
        csvContent += `"Date Range:","${options.dateRange.startDate} to ${options.dateRange.endDate}"\n`
      } else if (options.dateRange.startDate) {
        csvContent += `"From Date:","${options.dateRange.startDate}"\n`
      } else if (options.dateRange.endDate) {
        csvContent += `"To Date:","${options.dateRange.endDate}"\n`
      }
      csvContent += `"Generated:","${new Date().toLocaleString()}"\n`
      csvContent += '\n'
    }
    
    // Add summary if provided
    if (options.summary) {
      csvContent += '"SUMMARY"\n'
      csvContent += `"Total Transactions:",${options.summary.totalTransactions || 0}\n`
      csvContent += `"Total Amount:","${formatCurrency(options.summary.totalAmount || 0)}"\n`
      if (options.summary.byType) {
        csvContent += '\n'
        csvContent += '"Transaction Type Breakdown:"\n'
        Object.keys(options.summary.byType).forEach(type => {
          const typeInfo = options.summary.byType[type]
          csvContent += `"  ${type}:","Count: ${typeInfo.count || 0}","Amount: ${formatCurrency(typeInfo.totalAmount || 0)}"\n`
        })
      }
      csvContent += '\n'
    }
    
    // Add headers
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
    
    // Add data rows
    data.forEach(row => {
      csvContent += row.map(cell => {
        // Escape quotes and wrap in quotes
        const cellStr = String(cell || '')
        return `"${cellStr.replace(/"/g, '""')}"`
      }).join(',') + '\n'
    })
    
    // Add totals row if summary provided
    if (options.summary && data.length > 0) {
      csvContent += '\n'
      csvContent += `"TOTAL","","","","","","${formatCurrency(options.summary.totalAmount || 0)}"\n`
    }
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const dateStr = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log(`[CSV Export] Report saved: ${finalFilename}`)
  } catch (error) {
    console.error('[CSV Export] Error:', error)
    throw error
  }
}

