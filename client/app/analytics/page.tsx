import Link from 'next/link'

export default function AnalyticsPage() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <span>
          <Link href="/dashboard" className="hover:underline text-blue-600">
            Хяналтын самбар
          </Link>
          {' / '}
        </span>
        Аналитик
      </nav>
      <h1 className="text-2xl font-bold mb-2">Аналитикийн хуудас</h1>
      <p className="text-slate-500">Энэ нь Аналитик маршрутын түр контент юм.</p>
    </div>
  )
}
