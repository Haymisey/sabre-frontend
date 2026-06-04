import { motion } from 'framer-motion'
import { Mail, Phone, User } from 'lucide-react'
import CopyPnrButton from './CopyPnrButton'

function normalizeContact(raw) {
  const contact = raw?.contact && typeof raw.contact === 'object' ? raw.contact : raw
  if (!contact || typeof contact !== 'object') return { emails: [], phones: [], name: null }

  const emails = []
  if (Array.isArray(contact.emails)) {
    contact.emails.forEach((e) => {
      const addr = typeof e === 'string' ? e : e?.email ?? e?.address
      if (addr) emails.push(addr)
    })
  }
  if (contact.email && typeof contact.email === 'string') {
    emails.push(contact.email)
  }

  const phones = []
  if (Array.isArray(contact.phones)) {
    contact.phones.forEach((p) => {
      if (typeof p === 'string') {
        phones.push({ label: 'Phone', display: p })
        return
      }
      const cc = p?.countryCode ?? p?.country
      const num = p?.number ?? p?.phoneNumber
      if (!num) return
      const display = cc ? `+${String(cc).replace(/^\+/, '')} ${num}` : String(num)
      const label = p?.type ? String(p.type).replace(/_/g, ' ') : 'Phone'
      phones.push({ label, display })
    })
  }
  const legacyPhone = contact.phone || contact.mobile
  if (legacyPhone && !phones.length) {
    phones.push({ label: 'Phone', display: legacyPhone })
  }

  const name = contact.name || contact.fullName || null

  return {
    name,
    emails: [...new Set(emails)],
    phones,
  }
}

export default function BookingContact({ data }) {
  if (!data) return null

  const pnr = data.pnr
  const { name, emails, phones } = normalizeContact(data)
  const hasContent = name || emails.length > 0 || phones.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-b from-[var(--primary)]/10 to-[var(--bg-card)] p-5 shadow-lg"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Booking contact
          </p>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
            Contact on file
          </h3>
        </div>
        {pnr && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-xs font-bold text-[var(--bg-dark)]">
              {pnr}
            </span>
            <CopyPnrButton pnr={pnr} />
          </div>
        )}
      </div>

      {!hasContent ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
          No contact details were returned for this booking.
        </p>
      ) : (
        <div className="space-y-3">
          {name && (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3">
              <User className="h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Name
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
              </div>
            </div>
          )}

          {emails.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  {emails.length === 1 ? 'Email' : 'Email addresses'}
                </p>
              </div>
              <ul className="space-y-2 pl-7">
                {emails.map((email) => (
                  <li key={email}>
                    <a
                      href={`mailto:${email}`}
                      className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phones.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Phone className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  {phones.length === 1 ? 'Phone' : 'Phone numbers'}
                </p>
              </div>
              <ul className="space-y-2 pl-7">
                {phones.map((phone, i) => (
                  <li key={`${phone.display}-${i}`}>
                    {phones.length > 1 && (
                      <span className="text-[10px] uppercase text-[var(--text-secondary)]">
                        {phone.label}
                      </span>
                    )}
                    <a
                      href={`tel:${phone.display.replace(/\s/g, '')}`}
                      className="block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {phone.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
