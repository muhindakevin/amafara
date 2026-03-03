import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  const handlePage = (page) => {
    onPageChange(page)
  }

  const renderPageButtons = () => {
    const buttons = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    // First page
    if (start > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePage(1)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          1
        </button>
      )
      if (start > 2) {
        buttons.push(<span key="dots1" className="px-2">...</span>)
      }
    }

    // Page numbers
    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePage(i)}
          className={`px-3 py-2 text-sm border rounded ${
            i === currentPage
              ? 'bg-amber-600 text-white border-amber-600'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      )
    }

    // Last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        buttons.push(<span key="dots2" className="px-2">...</span>)
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePage(totalPages)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {totalPages}
        </button>
      )
    }

    return buttons
  }

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${className}`}>
      <button
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      {renderPageButtons()}

      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export default Pagination
