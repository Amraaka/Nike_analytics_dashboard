"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Folder, BarChart, Users, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

const links = [
  { href: '/dashboard', label: 'Хяналтын самбар', icon: LayoutDashboard },
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
        type="button"
        className="md:hidden block fixed top-4 right-4 z-50 bg-blue-600 text-white p-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Хажуу цэс хаах' : 'Хажуу цэс нээх'}
        aria-expanded={open}
        aria-controls="sidebar-nav"
      >
        <span className="sr-only">{open ? 'Хажуу цэс хаах' : 'Хажуу цэс нээх'}</span>
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={`
          ${open ? 'translate-x-0' : '-translate-x-full'}
          fixed z-40 top-0 left-0 h-screen w-64 max-w-full bg-white border-r border-slate-200 transition-transform duration-200 md:translate-x-0 flex flex-col
          md:w-56
        `}
        style={{ minWidth: open ? 220 : undefined }}
        tabIndex={-1}
        aria-hidden={!open && typeof window !== 'undefined' && window.innerWidth < 768}
      >
        {/* Logo/Avatar */}
        <div className="h-16 flex items-center gap-3 justify-center border-b border-slate-200 font-bold text-xl select-none">
          <span className="hidden md:inline">Хяналтын Самбар</span>
        </div>
        {/* Nav section */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">Үндсэн</div>
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
