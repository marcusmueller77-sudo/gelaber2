/**
 * Mistral AI Service
 * Beantwortet Patientenfragen auf Basis des Aufklärungsbogens
 */

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY
const MISTRAL_API_URL = 'https://api.mistral.ai/v1'

/**
 * System-Prompt für den KI-Assistenten
 */
const getSystemPrompt = (documentText, language) => {
  const languageText = language === 'de' 
    ? 'Antworte auf Deutsch'
    : 'Respond in English'
  
  return `Du bist ein medizinischer Aufklärungsassistent. ${languageText}.
Beantworte die Frage des Patienten ausschließlich auf Basis des folgenden Aufklärungsbogens.
Sei verständlich, beruhigend und kurz (max. 2-3 Sätze).
Wenn die Frage nicht durch den Aufklärungsbogen beantwortet werden kann, sag: "Diese Frage kann ich auf Basis des Aufklärungsbogens nicht beantworten. Bitte sprechen Sie mit Ihrem Arzt."

Aufklärungsbogen:
${documentText}`
}

/**
 * Frage an Mistral API senden und Antwort erhalten
 * @param {string} question - Patientenfrage
 * @param {string} documentText - Aufklärungsbogenttext (Kontext)
 * @param {string} language - Sprache ('de' oder 'en')
 * @returns {Promise<string>} KI-Antwort
 */
export const askMistral = async (question, documentText, language = 'de') => {
  try {
    const systemPrompt = getSystemPrompt(documentText, language)
    
    const response = await fetch(
      `${MISTRAL_API_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.3, // Niedrigere Temperatur für konsistentere Antworten
          max_tokens: 500
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData.message || 'Unbekannter Fehler'}`)
    }
    
    const data = await response.json()
    
    // Antwort aus der Response extrahieren
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content
    }
    
    throw new Error('Unerwartete API-Antwort')
  } catch (error) {
    console.error('Mistral API Fehler:', error)
    throw error
  }
}

/**
 * Mehrere Fragen hintereinander stellen (für Session-Verlauf)
 * @param {Array<string>} questions - Array von Fragen
 * @param {string} documentText - Kontext
 * @param {string} language - Sprache
 * @returns {Promise<Array<string>>} Array von Antworten
 */
export const askMultipleQuestions = async (questions, documentText, language = 'de') => {
  const answers = []
  
  for (const question of questions) {
    try {
      const answer = await askMistral(question, documentText, language)
      answers.push(answer)
    } catch (error) {
      console.error('Fehler beim Beantworten der Frage:', error)
      answers.push('Fehler: Die Antwort konnte nicht generiert werden.')
    }
  }
  
  return answers
}

/**
 * Text übersetzen mit Mistral API
 * @param {string} text - Zu übersetzender Text
 * @param {string} targetLanguage - Zielsprache ('de' oder 'en')
 * @returns {Promise<string>} Übersetzter Text
 */
export const translateText = async (text, targetLanguage = 'de') => {
  try {
    const instruction = targetLanguage === 'de'
      ? 'Übersetze in medizinisches Deutsch'
      : 'Translate to medical English'
    
    const systemPrompt = 'Du bist ein professioneller medizinischer Übersetzer. Übersetze den folgenden Text präzise und vollständig. Gib nur den übersetzten Text zurück, ohne Erklärungen.'
    
    const response = await fetch(
      `${MISTRAL_API_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `${instruction}\n\n${text}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData.message || 'Unbekannter Fehler'}`)
    }
    
    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content
    }
    
    throw new Error('Unerwartete API-Antwort')
  } catch (error) {
    console.error('Mistral Übersetzungsfehler:', error)
    throw error
  }
}

export default {
  askMistral,
  askMultipleQuestions,
  translateText
}
