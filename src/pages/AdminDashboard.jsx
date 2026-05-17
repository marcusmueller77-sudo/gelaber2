import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logoutAdmin, onAuthChange, getCurrentUser } from '../services/firebase'
import DocumentUpload from '../components/DocumentUpload'

/**
 * Admin-Dashboard Seite
 * Zentrale Verwaltungsoberfläche für Dokumente und Sitzungen
 */
export default function AdminDashboard({ onStartDocumentSession }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  
  const [documents, setDocuments] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setCurrentUser(user)
    })

    // Try to set initial user synchronously if available
    try {
      const u = getCurrentUser()
      if (u) setCurrentUser(u)
    } catch (e) {
      // ignore
    }

    return () => unsub()
  }, [])

  /**
   * Logout Handler
   */
  const handleLogout = async () => {
    try {
      await logoutAdmin()
      navigate('/login')
    } catch (err) {
      console.error('Logout-Fehler:', err)
    }
  }

  /**
   * Dokumenten-Sitzung starten
   */
  const handleStartSession = (document) => {
    onStartDocumentSession?.(document)
  }

  /**
   * Sprache wechseln
   */
  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">gelaber2</h1>
            <p className="text-gray-600 text-sm">{t('dashboard.title')}</p>
            <p className="text-sm text-gray-700 mt-1">Auth Status: {currentUser ? currentUser.email : 'nicht eingeloggt'}</p>
          </div>

          {/* Header-Buttons */}
          <div className="flex gap-3">
            {/* Sprache wechseln */}
            <button
              onClick={toggleLanguage}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition"
            >
              {i18n.language === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('documents.title')}</h2>
          <DocumentUpload onDocumentsChange={setDocuments} onStartReading={handleStartSession} />
        </div>
      </div>
    </div>
  )
}
