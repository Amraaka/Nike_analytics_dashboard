export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-center">Sign In</h1>
        <form className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  )
}
