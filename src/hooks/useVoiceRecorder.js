// src/hooks/useVoiceRecorder.js
import { useState, useRef, useCallback } from 'react'
import { transcribeAudio } from '../services/transcribeService'

/**
 * Manages mic recording → transcription lifecycle.
 *
 * status: 'idle' | 'recording' | 'transcribing'
 *
 * Usage:
 *   const { status, analyserRef, toggle } = useVoiceRecorder({ onTranscript, onError })
 *   - Call toggle() to start or stop recording
 *   - Pass analyserRef to <WaveformBars> for live visualisation
 *   - onTranscript(text) is called with the final transcribed string
 *   - onError(message) is called with a human-readable error string
 */
export function useVoiceRecorder({ onTranscript, onError } = {}) {
  const [status, setStatus] = useState('idle')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)   // <-- shared with waveform renderer
  const abortRef = useRef(null)

  // ─── helpers ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  // ─── start ──────────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Web Audio API — feed stream into an AnalyserNode for the waveform
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64          // 32 frequency buckets — plenty for bars
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      // Pick the best supported codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        cleanup()

        if (blob.size === 0) {
          setStatus('idle')
          return
        }

        setStatus('transcribing')

        const controller = new AbortController()
        abortRef.current = controller

        try {
          const text = await transcribeAudio({
            blob,
            mimeType,
            signal: controller.signal,
          })
          if (text) onTranscript?.(text)
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('[voice] transcription error', err)
            onError?.('Transcription failed. Please try again.')
          }
        } finally {
          setStatus('idle')
        }
      }

      recorder.start()
      setStatus('recording')
    } catch (err) {
      cleanup()
      setStatus('idle')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onError?.('Microphone access denied. Please allow microphone permission and try again.')
      } else {
        console.error('[voice] start error', err)
        onError?.('Could not start recording. Please try again.')
      }
    }
  }, [cleanup, onTranscript, onError])

  // ─── stop ───────────────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // ─── cancel (abort without transcribing) ────────────────────────────────────

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    cleanup()
    setStatus('idle')
  }, [cleanup])

  // ─── toggle (click-to-start / click-to-stop) ────────────────────────────────

  const toggle = useCallback(() => {
    if (status === 'idle') startRecording()
    else if (status === 'recording') stopRecording()
    // while 'transcribing' the button is disabled — do nothing
  }, [status, startRecording, stopRecording])

  return { status, analyserRef, toggle, cancel }
}
