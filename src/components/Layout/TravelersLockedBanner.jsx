import { Users, Lock } from 'lucide-react'
import { formatPassengerCountsLabel, formatPassengerCountsShort } from '../../utils/passengers'

export default function TravelersLockedBanner({ counts, onNewSearch }) {
  if (!counts) return null

  return (
    <div className="mx-auto mb-3 flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
        <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span className="text-[var(--text-primary)]">
          Search locked: <strong>{formatPassengerCountsLabel(counts)}</strong>
        </span>
        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
          ({formatPassengerCountsShort(counts)})
        </span>
      </div>
      {onNewSearch && (
        <button
          type="button"
          onClick={onNewSearch}
          className="text-[10px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          New search (change travelers)
        </button>
      )}
    </div>
  )
}
