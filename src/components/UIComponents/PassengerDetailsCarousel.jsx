import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, User, Phone, Check } from 'lucide-react'
import {
  NAME_PREFIXES,
  GENDERS,
  COUNTRY_CODES,
  TYPE_LABELS,
  createFormsFromCounts,
  createEmptyContactForm,
  validateAllBookingForms,
  validatePassengerForm,
} from '../../utils/passengerForm'

const fieldClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50'

const labelClass = 'mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-0.5 text-[10px] text-red-400">{message}</p>
}

function PassengerFormCard({ form, errors, onChange }) {
  const prefixes = NAME_PREFIXES[form.type] || NAME_PREFIXES.ADT

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]">
          <User className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {TYPE_LABELS[form.type]} · Passenger {form.passengerIndex}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">Required fields marked below</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Title</label>
          <select
            value={form.prefix}
            onChange={(e) => onChange({ prefix: e.target.value })}
            className={fieldClass}
          >
            {prefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError message={errors.prefix} />
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select
            value={form.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            className={fieldClass}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <FieldError message={errors.gender} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>First name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={fieldClass}
            autoComplete="given-name"
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label className={labelClass}>Last name</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={fieldClass}
            autoComplete="family-name"
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Middle name (optional)</label>
        <input
          type="text"
          value={form.middleName}
          onChange={(e) => onChange({ middleName: e.target.value })}
          className={fieldClass}
        />
        <FieldError message={errors.middleName} />
      </div>

      <div>
        <label className={labelClass}>Date of birth</label>
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
          className={fieldClass}
        />
        <FieldError message={errors.dateOfBirth} />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className={fieldClass}
          autoComplete="email"
        />
        <FieldError message={errors.email} />
      </div>
    </div>
  )
}

function ContactFormCard({ contact, errors, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]">
          <Phone className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Contact details</p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            Used for booking confirmation & alerts
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Country code</label>
        <select
          value={contact.countryCode}
          onChange={(e) => onChange({ countryCode: e.target.value })}
          className={fieldClass}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.countryCode} />
      </div>

      <div>
        <label className={labelClass}>Booking email</label>
        <input
          type="email"
          value={contact.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className={fieldClass}
          autoComplete="email"
        />
        <FieldError message={errors.email} />
      </div>

      <div>
        <label className={labelClass}>Mobile number</label>
        <input
          type="tel"
          inputMode="numeric"
          value={contact.number}
          onChange={(e) => onChange({ number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
          className={fieldClass}
          placeholder="915777272"
        />
        <FieldError message={errors.number} />
      </div>
    </div>
  )
}

export default function PassengerDetailsCarousel({
  passengerCounts,
  onSubmit,
  onCancel,
  disabled,
}) {
  const totalSlides =
    passengerCounts.ADT + passengerCounts.CHLD + passengerCounts.INF + 1

  const [slideIndex, setSlideIndex] = useState(0)
  const [passengerForms, setPassengerForms] = useState(() =>
    createFormsFromCounts(passengerCounts),
  )
  const [contactForm, setContactForm] = useState(createEmptyContactForm)
  const [validation, setValidation] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [completedPassengers, setCompletedPassengers] = useState(() => new Set())

  const passengerCount =
    passengerCounts.ADT + passengerCounts.CHLD + passengerCounts.INF
  const isContactSlide = slideIndex === passengerCount

  useEffect(() => {
    setPassengerForms(createFormsFromCounts(passengerCounts))
    setSlideIndex(0)
    setValidation(null)
    setCompletedPassengers(new Set())
  }, [passengerCounts])

  const allPassengersComplete =
    passengerForms.length > 0 &&
    passengerForms.every((f) => completedPassengers.has(f.passengerIndex))

  const updatePassenger = (index, patch) => {
    setCompletedPassengers((prev) => {
      const next = new Set(prev)
      next.delete(passengerForms[index]?.passengerIndex)
      return next
    })
    setPassengerForms((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    )
    setValidation(null)
    setSubmitError(null)
  }

  const handleNext = () => {
    if (isContactSlide) return
    const form = passengerForms[slideIndex]
    const errs = validatePassengerForm(form)
    if (Object.keys(errs).length > 0) {
      setValidation({
        passengerErrors: passengerForms.map((_, i) => (i === slideIndex ? errs : {})),
        contactErrors: {},
      })
      return
    }
    const nextCompleted = new Set(completedPassengers)
    nextCompleted.add(form.passengerIndex)
    setCompletedPassengers(nextCompleted)

    const allDone = passengerForms.every((f) => nextCompleted.has(f.passengerIndex))
    if (!allDone) {
      const nextIdx = passengerForms.findIndex((f) => !nextCompleted.has(f.passengerIndex))
      setSlideIndex(nextIdx >= 0 ? nextIdx : slideIndex + 1)
    } else {
      setSlideIndex(passengerCount)
    }
    setValidation(null)
    setSubmitError(null)
  }

  const goToSlide = (index) => {
    if (index === passengerCount && !allPassengersComplete) {
      setSubmitError('Complete every traveler before contact details.')
      return
    }
    setSlideIndex(index)
    setSubmitError(null)
  }

  const handleSubmit = () => {
    const result = validateAllBookingForms(passengerForms, contactForm)
    setValidation(result)
    if (!result.valid) {
      if (result.passengerErrors.some((e) => Object.keys(e).length > 0)) {
        const firstInvalid = result.passengerErrors.findIndex((e) => Object.keys(e).length > 0)
        setSlideIndex(firstInvalid)
      } else {
        setSlideIndex(passengerCount)
      }
      return
    }
    const apiResult = onSubmit({ passengerForms, contactForm })
    if (apiResult?.error) setSubmitError(apiResult.error)
  }

  const currentPassengerErrors = validation?.passengerErrors?.[slideIndex] || {}
  const contactErrors = validation?.contactErrors || {}

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-dark)]/60"
    >
      <div className="border-b border-[var(--border)] px-3 py-2">
        <p className="text-xs font-medium text-[var(--accent)]">Passenger details</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={slideIndex === 0 || disabled}
            onClick={() => setSlideIndex((i) => i - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-1 flex-wrap justify-center gap-1">
            {passengerForms.map((f, i) => {
              const done = completedPassengers.has(f.passengerIndex)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  className={`flex h-2 items-center rounded-full transition ${
                    slideIndex === i
                      ? 'bg-[var(--accent)] w-4'
                      : done
                        ? 'bg-green-500/60 w-2'
                        : 'bg-[var(--border)] w-2'
                  }`}
                  aria-label={`Passenger ${i + 1}${done ? ' complete' : ''}`}
                />
              )
            })}
            <button
              type="button"
              onClick={() => goToSlide(passengerCount)}
              disabled={!allPassengersComplete && !isContactSlide}
              className={`h-2 rounded-full transition ${
                isContactSlide ? 'bg-[var(--accent)] w-4' : 'bg-[var(--border)] w-2'
              } ${!allPassengersComplete ? 'opacity-40' : ''}`}
              aria-label="Contact"
            />
          </div>

          <button
            type="button"
            disabled={isContactSlide || disabled}
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-[var(--text-secondary)]">
          {isContactSlide
            ? 'Contact · final step'
            : `Traveler ${slideIndex + 1} of ${passengerCount} — use Next when done`}
        </p>
        {!allPassengersComplete && !isContactSlide && (
          <p className="mt-0.5 text-center text-[10px] text-amber-400/90">
            {completedPassengers.size} of {passengerCount} completed
          </p>
        )}
      </div>

      <div className="p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={isContactSlide ? 'contact' : slideIndex}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {isContactSlide ? (
              <ContactFormCard
                contact={contactForm}
                errors={contactErrors}
                onChange={(patch) => {
                  setContactForm((c) => ({ ...c, ...patch }))
                  setValidation(null)
                  setSubmitError(null)
                }}
              />
            ) : (
              <PassengerFormCard
                form={passengerForms[slideIndex]}
                errors={currentPassengerErrors}
                onChange={(patch) => updatePassenger(slideIndex, patch)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <p className="mt-2 text-[10px] text-red-400">{submitError}</p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 rounded-xl border border-[var(--border)] py-2 text-xs font-medium text-[var(--text-secondary)]"
          >
            Back
          </button>
          {isContactSlide ? (
            <button
              type="button"
              disabled={disabled}
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] py-2 text-xs font-semibold text-[var(--bg-dark)]"
            >
              <Check className="h-3.5 w-3.5" />
              Submit passenger details
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={handleNext}
              className="flex-1 rounded-xl bg-[var(--primary)] py-2 text-xs font-semibold text-[var(--accent-light)]"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
