// Note: LucideIcon type is not exported from lucide-react, we'll use a different approach

function BalanceCard({ label, value, icon: Icon, color = 'bg-blue-500' }) {
  return (
    <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-green-600 font-semibold">↑ 12% from last month</p>
      </div>
    </div>
  )
}

export default BalanceCard


