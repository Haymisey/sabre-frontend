import axios from 'axios'

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || ''
const TRANSCRIBE_URL =
  import.meta.env.VITE_TRANSCRIBE_URL || `${BFF_BASE_URL}/api/voice/transcribe`

const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe-2025-12-15'
const REQUEST_TIMEOUT = 60000


const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_DIRECT_URL = 'https://api.openai.com/v1/audio/transcriptions'

const guessExtension = (mimeType = '') => {
  const type = mimeType.toLowerCase()
  if (type.includes('webm')) return 'webm'
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a'
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'
  if (type.includes('wav')) return 'wav'
  if (type.includes('ogg')) return 'ogg'
  return 'webm'
}

/**
 * @param {{ blob: Blob, mimeType?: string, signal?: AbortSignal }} params
 * @returns {Promise<string>} the transcribed text
 */
export const transcribeAudio = async ({ blob, mimeType, signal }) => {
  const useDirectTestMode = Boolean(OPENAI_API_KEY)

  if (!useDirectTestMode && !TRANSCRIBE_URL) {
    throw new Error('VITE_TRANSCRIBE_URL / VITE_BFF_URL is not configured.')
  }
  if (!blob) {
    throw new Error('Missing audio blob for transcription.')
  }

  const type = mimeType || blob.type || 'audio/webm'
  const extension = guessExtension(type)

  const formData = new FormData()
  formData.append('file', blob, `recording.${extension}`)
  formData.append('model', TRANSCRIBE_MODEL)

  const url = useDirectTestMode ? OPENAI_DIRECT_URL : TRANSCRIBE_URL
  const headers = useDirectTestMode
    ? { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${OPENAI_API_KEY}` }
    : { 'Content-Type': 'multipart/form-data' }

  try {
    const { data } = await axios.post(url, formData, {
      signal,
      timeout: REQUEST_TIMEOUT,
      headers,
    })

    const text = data?.text ?? data?.transcript ?? data?.data?.text ?? ''
    return typeof text === 'string' ? text.trim() : ''
  } catch (err) {
    throw new Error('Failed to transcribe audio.', { cause: err })
  }
}