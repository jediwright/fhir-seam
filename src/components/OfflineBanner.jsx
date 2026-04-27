import { useOnlineStatus } from '../hooks/useYjs'

/**
 * OfflineBanner — shown when the browser reports no network connectivity.
 * The form remains fully functional offline; only submission is gated.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5">
      <div className="max-w-2xl mx-auto flex items-center gap-2 text-amber-800">
        <span className="text-xs font-mono font-medium uppercase tracking-wider">
          ◦ Offline
        </span>
        <span className="text-xs text-amber-700">
          — Your form data is saving locally. Submission will be available when you reconnect.
        </span>
      </div>
    </div>
  )
}
