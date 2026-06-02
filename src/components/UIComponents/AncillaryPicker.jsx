import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Briefcase, Crown, ConciergeBell, CircleDollarSign } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'

const iconByCode = {
  BG: Briefcase,
  WF: Wifi,
  PB: Crown,
  TS: ConciergeBell,
}

export default function AncillaryPicker({ data, handlers }) {
  const [selectedMap, setSelectedMap] = useState({})
  const [error, setError] = useState(null)

  const groups = data?.groups || []
  const standalone = data?.standalone || []

  const selectedItems = useMemo(() => {
    const fromGroups = groups.flatMap((group) =>
      (group.ancillaries || [])
        .filter((a) => selectedMap[`${group.code}:${a.code}`])
        .map((a) => ({ ...a, groupCode: group.code, groupName: group.name })),
    )
    const fromStandalone = standalone
      .filter((a) => selectedMap[`ST:${a.code}`])
      .map((a) => ({ ...a, groupCode: 'ST', groupName: 'Other Services' }))
    return [...fromGroups, ...fromStandalone]
  }, [groups, standalone, selectedMap])

  const total = selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  const currency = selectedItems[0]?.currency || 'ETB'

  const toggle = (key) => {
    setSelectedMap((prev) => ({ ...prev, [key]: !prev[key] }))
    setError(null)
  }

  const onAddSelected = () => {
    const result = handlers?.handleAncillaryConfirm?.(selectedItems, data)
    if (result?.error) setError(result.error)
  }

  const onSkip = () => {
    handlers?.handleAncillarySkip?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Optional upgrades</p>
          <h3 className="font-heading text-lg text-[var(--text-primary)]">Enhance your trip</h3>
        </div>
        <span className="rounded-xl bg-[var(--primary)]/25 px-2.5 py-1 text-xs text-[var(--accent)]">
          {selectedItems.length} selected
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const Icon = iconByCode[group.code] || CircleDollarSign
          return (
            <div
              key={group.code}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/35 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">{group.name}</p>
              </div>

              <div className="space-y-2">
                {(group.ancillaries || []).map((a) => {
                  const key = `${group.code}:${a.code}`
                  const checked = Boolean(selectedMap[key])
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                        checked
                          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10'
                          : 'border-[var(--border)] bg-[var(--bg-card)]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(key)}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span className="text-[var(--text-primary)]">{a.name}</span>
                      </div>
                      <span className="font-semibold text-[var(--accent)]">
                        {formatPrice(a.price, a.currency)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        {standalone.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/35 p-3">
            <div className="mb-2 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Other Services</p>
            </div>

            <div className="space-y-2">
              {standalone.map((a) => {
                const key = `ST:${a.code}`
                const checked = Boolean(selectedMap[key])
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      checked
                        ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10'
                        : 'border-[var(--border)] bg-[var(--bg-card)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="text-[var(--text-primary)]">{a.name}</span>
                    </div>
                    <span className="font-semibold text-[var(--accent)]">
                      {formatPrice(a.price, a.currency)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-secondary)]">Selected total</span>
          <span className="font-semibold text-[var(--accent)]">{formatPrice(total, currency)}</span>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)]"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={onAddSelected}
          disabled={selectedItems.length === 0}
          className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--bg-dark)] transition hover:bg-[var(--accent-light)] disabled:opacity-40"
        >
          Add selected services
        </button>
      </div>
    </motion.div>
  )
}

