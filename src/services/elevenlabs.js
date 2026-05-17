/**
 * ElevenLabs Text-to-Speech Service
 * Konvertiert Text zu Sprache mit ElevenLabs API
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

let currentAudio = null

// ElevenLabs Standard-Stimmen
const VOICES = {
  de: 'pNInz6obpgDQGcFmaJgB', // Adam
  en: '21m00Tcm4TlvDq8ikWAM'  // Rachel
}

const getBrowserTtsLang = (language) => {
  if (language === 'de') return 'de-DE'
  if (language === 'en') return 'en-US'
  if (language === 'tr') return 'tr-TR'
  if (language === 'ru') return 'ru-RU'
  if (language === 'ar') return 'ar-SA'
  if (language === 'fa') return 'fa-IR'
  
  // Fallback für andere Formate wie 'de-DE' oder 'en-GB'
  return language.startsWith('de') ? 'de-DE' : 'en-US'
}

const speakWithBrowserTts = async (text, language = 'de') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('Browser Speech Synthesis nicht verfügbar')
  }

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Explizite Zuweisung der Sprache
    if (language === 'en') {
      utterance.lang = 'en-US'
    } else if (language === 'de') {
      utterance.lang = 'de-DE'
    } else if (language === 'tr') {
      utterance.lang = 'tr-TR'
    } else if (language === 'ru') {
      utterance.lang = 'ru-RU'
    } else if (language === 'ar') {
      utterance.lang = 'ar-SA'
    } else if (language === 'fa') {
      utterance.lang = 'fa-IR'
    } else {
      utterance.lang = getBrowserTtsLang(language)
    }

    utterance.onend = () => {
      window.speechSynthesis.cancel()
      resolve()
    }
    utterance.onerror = (event) => {
      window.speechSynthesis.cancel()
      reject(new Error(event.error || 'SpeechSynthesis Fehler'))
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Text-zu-Sprache konvertieren und Audiostream erhalten
 * @param {string} text - Text zum Vorlesen
 * @param {string} language - Sprache ('de' oder 'en')
 * @param {string} voiceId - ElevenLabs Voice ID (optional, verwendet default basierend auf sprache)
 * @returns {Promise<Blob>} Audio-Blob
 */
export const textToSpeech = async (text, language = 'de', voiceId = null) => {
  try {
    const finalVoiceId = voiceId || VOICES[language] || VOICES.de
    console.log('ElevenLabs Key vorhanden:', !!import.meta.env.VITE_ELEVENLABS_API_KEY)
    console.log('Verwendete Voice ID:', finalVoiceId)
    
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${finalVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    )
    
    if (!response.ok) {
      const error = new Error(`ElevenLabs API Fehler: ${response.status}`)
      error.status = response.status
      throw error
    }
    
    return await response.blob()
  } catch (error) {
    console.error('Text-to-Speech Fehler:', error)
    throw error
  }
}

/**
 * Text in Sätze aufteilen
 * @param {string} text - Volltext
 * @returns {Array<string>} Array von Sätzen
 */
export const splitIntoSentences = (text) => {
  // Deutsche/Englische Sätze aufteilen
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  // Leerzeichen trimmen
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * Satz-für-Satz-Vorlesen mit Hervorhebung
 * @param {string} text - Volltext
 * @param {string} language - Sprache
 * @param {Function} onSentenceChange - Callback bei Satzbeschreibung (Satz-Index, aktueller Satz)
 * @param {AbortSignal} signal - Zum Abbrechen des Abspielens
 * @param {string} voiceId - ElevenLabs Voice ID (optional)
 */
export const playTextWithHighlight = async (
  text,
  language = 'de',
  onSentenceChange,
  signal,
  voiceId = null
) => {
  try {
    const sentences = splitIntoSentences(text)
    
    for (let i = 0; i < sentences.length; i++) {
      if (signal?.aborted) {
        break
      }

      const sentence = sentences[i]
      if (onSentenceChange) {
        onSentenceChange(i, sentence)
      }

      try {
        const audioBlob = await textToSpeech(sentence, language, voiceId)
        await playSentence(audioBlob, signal)
      } catch (error) {
        if (error?.status === 401 || error?.status === 402) {
          console.warn('Fallback auf Browser Speech Synthesis wegen ElevenLabs Auth/Payment-Fehler', error.status)
          await speakWithBrowserTts(sentence, language)
        } else {
          throw error
        }
      }
    }
    
    if (onSentenceChange) {
      onSentenceChange(-1, '')
    }
  } catch (error) {
    console.error('Fehler beim Abspielen mit Hervorhebung:', error)
    throw error
  }
}

/**
 * Einzelnen Satz abspielen
 * @param {Blob} audioBlob - Audio-Blob
 * @param {AbortSignal} signal - Zum Abbrechen
 */
export const playSentence = (audioBlob, signal) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(audioBlob)
    audio.src = url
    currentAudio = audio

    if (signal) {
      signal.addEventListener('abort', () => {
        audio.pause()
        currentAudio = null
        URL.revokeObjectURL(url)
        reject(new Error('Abspielen abgebrochen'))
      })
    }

    audio.addEventListener('error', () => {
      currentAudio = null
      URL.revokeObjectURL(url)
      reject(new Error('Audio-Fehler'))
    })

    audio.addEventListener('ended', () => {
      currentAudio = null
      URL.revokeObjectURL(url)
      resolve()
    })

    audio.play().catch(err => {
      currentAudio = null
      URL.revokeObjectURL(url)
      reject(err)
    })
  })
}

export const stopPlayback = () => {
  if (currentAudio) {
    try {
      currentAudio.pause()
    } catch (error) {
      console.warn('Fehler beim Stoppen der Wiedergabe:', error)
    }
    currentAudio = null
  }
}

/**
 * Ganzen Text auf einmal abspielen (ohne Satz-Hervorhebung)
 * @param {string} text - Text zum Vorlesen
 * @param {string} language - Sprache
 * @param {AbortSignal} signal - Zum Abbrechen
 * @param {string} voiceId - ElevenLabs Voice ID (optional)
 */
export const playText = async (text, language = 'de', signal, voiceId = null) => {
  try {
    const audioBlob = await textToSpeech(text, language, voiceId)
    await playSentence(audioBlob, signal)
  } catch (error) {
    if (error?.status === 401 || error?.status === 402) {
      console.warn('Fallback auf Browser Speech Synthesis wegen ElevenLabs Auth/Payment-Fehler', error.status)
      await speakWithBrowserTts(text, language)
      return
    }

    console.error('Fehler beim Abspielen des Textes:', error)
    throw error
  }
}

export default {
  textToSpeech,
  splitIntoSentences,
  playTextWithHighlight,
  playSentence,
  playText,
  stopPlayback
}
