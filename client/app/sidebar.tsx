"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Folder, BarChart, Users, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: Folder },
  { href: '/analytics', label: 'Analytics', icon: BarChart },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      {/* Sidebar */}
      <aside
        className={`
          ${open ? 'translate-x-0' : '-translate-x-full'}
          fixed md:static z-40 top-0 left-0 h-full w-64 max-w-full bg-white border-r border-slate-200 transition-transform duration-200 md:translate-x-0 flex flex-col
          md:w-56 md:translate-x-0
        `}
        style={{ minWidth: open ? 220 : undefined }}
      >
        {/* Logo/Avatar */}
        <div className="h-16 flex items-center gap-3 justify-center border-b border-slate-200 font-bold text-xl select-none">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">SA</div>
          <span className="hidden md:inline">SaaS Dashboard</span>
        </div>
        {/* Nav section */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">Main</div>
          <nav className="flex flex-col gap-1 px-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-sm whitespace-nowrap ${
                  pathname === href
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Divider and bottom actions */}
        <div className="border-t border-slate-200 p-4 flex flex-col gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-slate-600 text-sm transition">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            Help
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-slate-600 text-sm transition">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
