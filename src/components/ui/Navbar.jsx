'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPinned,
  Ticket,
  User,
  LogOut,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const { user, logout } = useAuth()

  const [mounted, setMounted] =
    useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  /*
   * Driver has its own dedicated dashboard header.
   * Therefore the passenger/admin global navbar
   * should not appear on /driver.
   */

  if (pathname === '/driver') {
    return null
  }

  const role = mounted
    ? user?.role
    : null

  const isAdmin =
    role === 'admin'

  const isPassenger =
    role === 'user'

  const homePath =
    isAdmin
      ? '/admin'
      : '/'

  const onLogout = () => {
    logout()
    toast.success('Logged out')
    router.replace('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* BRAND */}

        <Link
          href={homePath}
          className="flex items-center gap-2.5"
        >
          <MapPinned
            size={21}
            className="text-blue-600"
          />

          <span className="text-base font-semibold tracking-tight text-gray-950">
            {isAdmin
              ? 'SmartCity Admin'
              : 'SmartCity'}
          </span>
        </Link>

        {/* NAVIGATION */}

        <div className="flex items-center gap-1">

          {/* ADMIN */}

          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950"
              >
                <LayoutDashboard
                  size={16}
                />

                <span className="hidden sm:inline">
                  Dashboard
                </span>
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950"
              >
                <Users size={16} />

                <span className="hidden sm:inline">
                  Drivers
                </span>
              </Link>
            </>
          )}

          {/* PASSENGER */}

          {isPassenger && (
            <Link
              href="/bookings"
              className="flex items-center font-semibold gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950"
            >
 

              <span className="hidden sm:inline">
                Bookings
              </span>
            </Link>
          )}

          {/* PROFILE */}

          <Link
            href="/profile"
            className="flex items-center font-semibold gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950"
          >
            <User size={16} />

            <span className="hidden sm:inline">
              {mounted
                ? user?.fname ||
                  'Profile'
                : 'Profile'}
            </span>
          </Link>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={onLogout}
            className="ml-1 flex items-center font-semibold gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut size={16} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>
      </div>
    </nav>
  )
}