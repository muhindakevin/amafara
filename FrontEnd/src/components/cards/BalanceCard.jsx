// Note: LucideIcon type is not exported from lucide-react, we'll use a different approach

function BalanceCard({ label, value, icon: Icon, color = 'bg-blue-500' }) {
  return (
    <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white break-words">{value}</p>
        </div>
        <div className={`${color} p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          <Icon className="text-white" size={20} style={{ width: '20px', height: '20px' }} />
        </div>
      </div>
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">↑ 12% from last month</p>
      </div>
    </div>
  )
}

export default BalanceCard


