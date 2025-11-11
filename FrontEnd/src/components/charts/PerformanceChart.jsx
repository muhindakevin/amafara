import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', savings: 200000, loans: 150000 },
  { month: 'Feb', savings: 250000, loans: 180000 },
  { month: 'Mar', savings: 300000, loans: 200000 },
  { month: 'Apr', savings: 350000, loans: 220000 },
  { month: 'May', savings: 400000, loans: 250000 },
  { month: 'Jun', savings: 450000, loans: 280000 },
]

function PerformanceChart() {
  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="savings" stroke="#0A84FF" strokeWidth={2} />
          <Line type="monotone" dataKey="loans" stroke="#10B981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PerformanceChart


