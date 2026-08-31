'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'
import { useRouter } from 'next/navigation'
import { MapPin, Bus, Ticket, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  
  // Track client hydration state
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onLogout = () => {
    logout()
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3
                    flex items-center justify-between z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <MapPin className="text-blue-400" size={20} />
        <span className="text-white font-bold">SmartCity</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <Link href="/transit"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white
                     text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition">
          <Bus size={15} />
          <span className="hidden md:inline">Transit</span>
        </Link>

        <Link href="/bookings"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white
                     text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition">
          <Ticket size={15} />
          <span className="hidden md:inline">Bookings</span>
        </Link>

        <Link href="/profile"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white
                     text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition">
          <User size={15} />
          <span className="hidden md:inline">
            {mounted ? (user?.fname || 'Profile') : 'Profile'}
          </span>
        </Link>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300
                     text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition">
          <LogOut size={15} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  )
}