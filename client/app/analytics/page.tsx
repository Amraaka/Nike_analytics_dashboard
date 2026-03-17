import Link from 'next/link'

export default function AnalyticsPage() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <span>
          <Link href="/dashboard" className="hover:underline text-blue-600">
            Dashboard
          </Link>
          {' / '}
        </span>
        Analytics
      </nav>
      <h1 className="text-2xl font-bold mb-2">Analytics Page</h1>
      <p className="text-slate-500">This is a placeholder for the Analytics route.</p>
    </div>
  )
}
