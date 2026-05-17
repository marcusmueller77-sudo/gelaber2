import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QuestionButton from './QuestionButton'

/**
 * TextPlayer-Komponente
 * Spielt den Aufklärungsbogentext Satz für Satz vor
 */
export default function TextPlayer({ text, language = 'de', voiceId = null }) {
  const { t } = useTranslation()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState(-1)
  const [currentSentence, setCurrentSentence] = useState('')
  const [error, setError] = useState('')

  const currentIndex = useRef(0)
  const isMounted = useRef(true)

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text || '']

  useEffect(() => {
    return () => {
      isMounted.current = false
      window.speechSynthesis.cancel()
    }
  }, [])

  const getSpeechLanguage = () => (language === 'de' ? 'de-DE' : 'en-US')

  const playFromIndex = (index) => {
    const startIndex = index >= 0 && index < sentences.length ? index : 0
    currentIndex.current = startIndex
    setError('')
    setShowQuestion(false)
    setIsPaused(false)
    setIsPlaying(true)

    const sentence = sentences[startIndex]
    setHighlightedSentenceIndex(startIndex)
    setCurrentSentence(sentence)

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.lang = getSpeechLanguage()

    utterance.onend = () => {
      if (!isMounted.current) return

      currentIndex.current += 1
      if (currentIndex.current < sentences.length) {
        playFromIndex(currentIndex.current)
      } else {
        setIsPlaying(false)
        setHighlightedSentenceIndex(-1)
        setCurrentSentence('')
      }
    }

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'cancelled') {
        console.error('TTS-Fehler:', event.error)
        setError(t('patientView.ttsError'))
      }
      setIsPlaying(false)
      setIsPaused(false)
      setShowQuestion(false)
      setHighlightedSentenceIndex(-1)
      setCurrentSentence('')
    }

    window.speechSynthesis.speak(utterance)
  }

  const handlePlay = () => {
    if (isPlaying) return
    currentIndex.current = 0
    playFromIndex(0)
  }

  const handlePause = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(true)
    setShowQuestion(true)
  }

  const handleResume = () => {
    playFromIndex(currentIndex.current)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setShowQuestion(false)
    setHighlightedSentenceIndex(-1)
    setCurrentSentence('')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 justify-center flex-wrap">
        {!isPlaying && !isPaused ? (
          <button
            onClick={handlePlay}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition min-h-[48px] min-w-[48px] text-lg"
          >
            ▶ {t('patientView.play')}
          </button>
        ) : isPlaying ? (
          <>
            <button
              onClick={handlePause}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-8 rounded-lg transition min-h-[48px] min-w-[48px] text-lg"
            >
              ⏸ Pause
            </button>
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-lg transition min-h-[48px] min-w-[48px] text-lg"
            >
              ◼ {t('patientView.stop')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleResume}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition min-h-[48px] min-w-[48px] text-lg"
            >
              ▶ Weiter
            </button>
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-lg transition min-h-[48px] min-w-[48px] text-lg"
            >
              ◼ {t('patientView.stop')}
            </button>
          </>
        )}
      </div>

      {isPlaying && currentSentence && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-center text-gray-600 text-sm mb-2">{t('patientView.listeningText')}</p>
          <p className="text-lg font-semibold text-center text-blue-900">
            {currentSentence}
          </p>
        </div>
      )}

      {showQuestion && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 text-center">
            Haben Sie eine Frage?
          </h3>
          <QuestionButton
            documentText={text}
            documentLanguage={language}
            voiceId={voiceId}
            onQuestionAnswered={() => {
              // Optional: Automatisch weitermachen nach Frage
            }}
          />
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-lg p-6 max-h-96 overflow-y-auto">
        <div className="text-base leading-relaxed text-gray-800">
          {sentences.map((sentence, index) => (
            <span
              key={index}
              className={index === highlightedSentenceIndex ? 'highlight-sentence' : ''}
            >
              {sentence}{' '}
            </span>
          ))}
        </div>
      </div>

      {isPlaying && (
        <p className="text-sm text-gray-600 text-center animate-pulse">
          {t('common.loading')}...
        </p>
      )}
    </div>
  )
}
