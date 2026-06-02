import { Search, Users, Plane, CheckCircle2, UserCircle, Receipt, Lock } from 'lucide-react'

const STEPS = [
  { key: 'search', label: 'Search', icon: Search },
  { key: 'travelers', label: 'Travelers', icon: Users },
  { key: 'select', label: 'Select flight', icon: Plane },
  { key: 'confirm', label: 'Confirm fare', icon: CheckCircle2 },
  { key: 'details', label: 'Passenger info', icon: UserCircle },
  { key: 'price', label: 'Full price', icon: Receipt },
  { key: 'hold', label: 'Hold', icon: Lock },
]

const STEP_INDEX = {
  search: 0,
  travelers: 1,
  select: 2,
  confirm: 3,
  details: 4,
  price: 5,
  hold: 6,
}

export default function BookingFlowBanner({ currentStep = 'search' }) {
  const activeIdx = STEP_INDEX[currentStep] ?? 0

  return (
    <div className="mb-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/80 px-2 py-2">
      <div className="flex min-w-max items-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const done = i < activeIdx
          const active = i === activeIdx
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium ${
                  active
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : done
                      ? 'text-green-400/90'
                      : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="h-3 w-3" />
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-[var(--border)]">›</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
