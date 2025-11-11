import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, User, Phone, Mail, Lock, ArrowRight, Calendar, MapPin, Briefcase, CreditCard } from 'lucide-react'
import api from '../utils/api'

function Signup() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    groupId: '',
    occupation: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    reason: ''
  })

  useEffect(() => {
    let mounted = true
    async function loadGroups() {
      try {
        const { data } = await api.get('/public/groups')
        if (mounted && data?.success) setGroups(data.data)
      } catch (e) {
        // silently ignore
      }
    }
    loadGroups()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (form.password !== form.confirmPassword) {
        alert('Passwords do not match')
        setLoading(false)
        return
      }
      const { data } = await api.post('/member-applications', form)
      if (data?.success) {
        alert('Your registration has been submitted. Please wait for approval from your Group Admin.')
        navigate('/login')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <div className="card bg-white/95 backdrop-blur-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Users size={20}/> Member Signup</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="email" className="input-field pl-12" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="+2507..." required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">National ID</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12" value={form.nationalId} onChange={(e)=>setForm({...form,nationalId:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" className="input-field pl-12" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" className="input-field pl-12" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Group</label>
            <select className="input-field" value={form.groupId} onChange={(e)=>setForm({...form,groupId:e.target.value})} required>
              <option value="">Choose group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation</label>
            <input className="input-field" value={form.occupation} onChange={(e)=>setForm({...form,occupation:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
            <input className="input-field" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="date" className="input-field pl-12" value={form.dateOfBirth} onChange={(e)=>setForm({...form,dateOfBirth:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Why do you want to join?</label>
            <textarea className="input-field" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} />
          </div>
          <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Submitting...' : <>Submit Application <ArrowRight size={20} /></>}
          </button>
          <button type="button" onClick={()=>navigate('/login')} className="btn-secondary w-full">Back to Login</button>
        </form>
      </div>
    </div>
  )
}

export default Signup


