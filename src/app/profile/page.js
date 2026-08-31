'use client'
import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { useDispatch }         from 'react-redux'
import toast                    from 'react-hot-toast'
import { User, Mail, Phone, Loader2, Save } from 'lucide-react'
import { useAuth }             from '../../hooks/useAuth'
import { getProfileAPI, updateProfileAPI } from '../../api/auth.api'
import { setCredentials }      from '../../store/authSlice'
import Navbar                  from '../../components/ui/Navbar'

export default function Profile() {
  const router   = useRouter()
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, loading: authLoading } = useAuth()

  const [form, setForm] = useState({ fname: '', lname: '', email: '', phone: '' })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchProfile = async () => {
      try {
        const res = await getProfileAPI()
        const data = res.data.data
        setForm({
          fname: data.fname || '',
          lname: data.lname || '',
          email: data.email || '',
          phone: data.phone || '',
        })
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfileAPI(form)
      dispatch(setCredentials({ user: res.data.data, token }))
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">🗺️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-white text-2xl font-bold mb-6">My Profile</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-300 text-sm mb-1.5 block">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  name="fname"
                  value={form.fname}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none
                             focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="text-gray-300 text-sm mb-1.5 block">Last Name</label>
              <input
                type="text"
                name="lname"
                value={form.lname}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-3 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                className="w-full bg-gray-800/50 border border-gray-700 text-gray-500
                           rounded-xl pl-9 pr-4 py-2.5 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1.5 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                       text-white font-medium rounded-xl py-2.5 text-sm
                       flex items-center justify-center gap-2 transition"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}