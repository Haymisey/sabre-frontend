import { motion } from 'framer-motion'
import { Mail, Phone, User } from 'lucide-react'

export default function BookingContact({ data }) {
  if (!data) return null

  const contact = data.contact || data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      <h3 className="font-heading mb-4 text-lg font-semibold">Contact on File</h3>
      <div className="space-y-3">
        {(contact.name || contact.fullName) && (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-dark)]/40 p-3">
            <User className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-[10px] text-[var(--text-secondary)]">Name</p>
              <p className="text-sm">{contact.name || contact.fullName}</p>
            </div>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-dark)]/40 p-3">
            <Mail className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-[10px] text-[var(--text-secondary)]">Email</p>
              <p className="text-sm">{contact.email}</p>
            </div>
          </div>
        )}
        {(contact.phone || contact.mobile) && (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-dark)]/40 p-3">
            <Phone className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-[10px] text-[var(--text-secondary)]">Phone</p>
              <p className="text-sm">{contact.phone || contact.mobile}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
