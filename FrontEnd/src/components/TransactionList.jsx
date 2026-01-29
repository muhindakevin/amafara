import { useTranslation } from 'react-i18next'

function TransactionList({ transactions }) {
  const { t } = useTranslation('dashboard')

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const translateStatus = (status) => {
    const statusMap = {
      completed: t('completed', { defaultValue: 'Completed' }),
      pending: t('pending', { defaultValue: 'Pending' }),
      active: t('active', { defaultValue: 'Active' }),
      inactive: t('inactive', { defaultValue: 'Inactive' }),
      failed: t('failed', { defaultValue: 'Failed' })
    }
    return statusMap[status] || status
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors group gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
              {transaction.type[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">{transaction.type}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{transaction.date}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 flex-shrink-0">
            <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">
              {transaction.amount.toLocaleString()} RWF
            </span>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
              {translateStatus(transaction.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TransactionList


