// src/components/Chat/WaveformBars.jsx
import { useEffect, useRef } from 'react'

const BAR_COUNT = 20

/**
 * Renders an animated waveform bar visualiser driven by a Web Audio AnalyserNode.
 *
 * Props:
 *   analyserRef  - React ref whose .current is an AnalyserNode (or null when idle)
 *   active       - boolean; when false the bars animate with a gentle idle pulse
 */
export default function WaveformBars({ analyserRef, active }) {
  const barsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const dataArray = new Uint8Array(BAR_COUNT)
    let frame = 0

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      frame++

      const bars = barsRef.current
      if (!bars.length) return

      if (active && analyserRef?.current) {
        // Real frequency data from the microphone
        analyserRef.current.getByteFrequencyData(dataArray)
        bars.forEach((bar, i) => {
          if (!bar) return
          const raw = dataArray[i] ?? 0
          // Map 0–255 → 10–100 % height
          const pct = 10 + (raw / 255) * 90
          bar.style.height = `${pct}%`
        })
      } else {
        // Idle / transcribing: gentle sine-wave breathing animation
        bars.forEach((bar, i) => {
          if (!bar) return
          const wave = Math.sin(frame * 0.05 + i * 0.5) * 0.5 + 0.5
          const pct = 10 + wave * 20 // oscillates between 10–30 %
          bar.style.height = `${pct}%`
        })
      }
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, analyserRef])

  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      style={{ height: '36px', width: `${BAR_COUNT * 7}px` }}
      aria-hidden="true"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="w-[3px] rounded-full transition-none"
          style={{
            height: '10%',
            backgroundColor: active
              ? 'var(--accent)'
              : 'var(--text-secondary)',
            opacity: active ? 1 : 0.5,
            transition: 'background-color 0.3s, opacity 0.3s',
          }}
        />
      ))}
    </div>
  )
}
