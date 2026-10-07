'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPinned,
  Ticket,
  User,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const { user, isAuthenticated, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Drivers have their own dedicated dashboard header.
  if (pathname === '/driver') {
    return null
  }

  // Avoid rendering different auth navigation before hydration.
  const authenticated = mounted && isAuthenticated
  const role = authenticated ? user?.role : null

  const isAdmin = role === 'admin'
  const isPassenger = role === 'user'

  const homePath = isAdmin ? '/admin' : '/'

  const onLogout = () => {
    logout()
    toast.success('Logged out')
    router.replace('/')
  }

  const linkClass =
    'inline-flex items-center gap-0.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950'

  return (
    <nav className="relative z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <Link href={homePath} className="flex items-center gap-1" aria-label="SmartCity home">
          <MapPinned size={22} className="text-blue-600"/>
          <span className="text-base font-semibold tracking-tight text-gray-950">
            {isAdmin ? 'SmartCity Admin' : 'SmartCity'}
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {!mounted ? null : !authenticated ? (
            <>
              {/* Public visitor navigation */}
              <Link href="/login" className={linkClass}>
                <LogIn size={16} />
                <span>Login</span>
              </Link>
            </>
          ) : (
            <>
              {/* Admin navigation */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className={linkClass}
                  >
                    <LayoutDashboard size={16} />
                    <span className="hidden sm:inline">
                      Dashboard
                    </span>
                  </Link>

                  <Link
                    href="/admin"
                    className={linkClass}
                  >
                    <Users size={16} />
                    <span className="hidden sm:inline">
                      Drivers
                    </span>
                  </Link>
                </>
              )}

              {/* Passenger navigation */}
              {isPassenger && (
                <Link
                  href="/bookings"
                  className={linkClass}
                >
                  <Ticket size={16} />
                  <span className="hidden sm:inline">
                    Bookings
                  </span>
                </Link>
              )}

              {/* Profile */}
              <Link
                href="/profile"
                className={linkClass}
              >
                <User size={16} />

                <span className="hidden sm:inline">
                  {user?.fname || 'Profile'}
                </span>
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={onLogout}
                className="ml-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold
                 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900">
                <LogOut size={16} />

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}