'use client'
import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import Link               from 'next/link'
import { useDispatch }    from 'react-redux'
import toast               from 'react-hot-toast'
import { MapPin, Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import { registerAPI }    from '../../api/auth.api'
import { setCredentials } from '../../store/authSlice'

export default function Register() {
  const router   = useRouter()
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    fname:    '',
    lname:    '',
    email:    '',
    phone:    '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.fname || !form.lname || !form.email || !form.phone || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await registerAPI(form)
      dispatch(setCredentials({
        user:  res.data.data.user,
        token: res.data.data.token,
      }))
      toast.success('Account created!')
      router.push('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-3">
            <MapPin className="text-white" size={28} />
          </div>
          <h1 className="text-white text-2xl font-bold">SmartCity</h1>
          <p className="text-gray-400 text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          {/* First + Last name */}
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
                  placeholder=" "
                  className="w-full bg-gray-800 border border-gray-700 text-white
                             rounded-xl pl-9 pr-2.5 py-2.5 text-sm focus:outline-none
                             focus:border-blue-500 placeholder-gray-500"
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
                placeholder=" "
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-2.5 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-300 text-sm mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-gray-300 text-sm mb-1.5 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-sm mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none
                           focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                       text-white font-medium rounded-xl py-2.5 text-sm
                       flex items-center justify-center gap-2 transition"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}