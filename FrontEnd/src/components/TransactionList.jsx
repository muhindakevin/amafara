import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

function TransactionList({ transactions }) {
  const { language } = useLanguage()

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
      completed: t('dashboard.completed', language),
      pending: t('dashboard.pending', language),
      active: t('dashboard.active', language),
      inactive: t('dashboard.inactive', language),
      failed: 'Failed'
    }
    return statusMap[status] || status
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
              {transaction.type[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{transaction.type}</p>
              <p className="text-sm text-gray-500">{transaction.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-800">
              {transaction.amount.toLocaleString()} RWF
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
              {translateStatus(transaction.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TransactionList


