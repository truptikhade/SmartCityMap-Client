'use client'

import {
  ShieldCheck,
  LogOut,
} from 'lucide-react'

export default function AdminHeader({
  admin,
  onLogout,
}) {
  const firstName =
    admin?.fname || 'Admin'

  const lastName =
    admin?.lname || ''

  const initials =
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`
      .toUpperCase()

  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h1 className="text-sm font-semibold text-white">
              SmartCity Admin
            </h1>

            <p className="text-xs text-gray-500">
              Driver management
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {firstName} {lastName}
            </p>

            <p className="text-xs text-gray-500">
              Administrator
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
            {initials || 'A'}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="ml-1 flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-900 hover:text-white"
          >
            <LogOut size={15} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>

      </div>
    </header>
  )
}