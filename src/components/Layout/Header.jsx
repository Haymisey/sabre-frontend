import { Plane } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-card)]/80 px-4 py-3 backdrop-blur-md md:px-6"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/20">
        <Plane className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <div>
        <h1 className="font-heading text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Ethiopian Airlines
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">AI Travel Assistant</p>
      </div>
    </motion.header>
  )
}
