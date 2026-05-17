import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { uploadDocument, deleteDocument, onAuthChange, getCurrentUser, db } from '../services/firebase'
import { collection, getDocs } from 'firebase/firestore'

/**
 * DocumentUpload-Komponente
 * Ermöglicht Admin, PDF-Dokumente hochzuladen und zu verwalten
 */
export default function DocumentUpload({ onDocumentsChange, onStartReading }) {
  const { t } = useTranslation()
  
  const [documents, setDocuments] = useState([])
  const [documentName, setDocumentName] = useState('')
  const [language, setLanguage] = useState('de')
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  // Verfügbare Stimmen
  const VOICES = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' }
  ]

  // Dokumentenliste beim Mount laden
  useEffect(() => {
    // Auf Auth-Status hören und Dokumente erst laden, wenn ein User vorhanden ist
    const unsub = onAuthChange((user) => {
      setCurrentUser(user)
      if (user) {
        loadDocuments()
      }
    })

    return () => unsub()
  }, [])

  /**
   * Alle Dokumente laden
   */
  const loadDocuments = async () => {
    try {
      // Direktes getDocs ohne where/orderBy, damit Lesen auch ohne Auth funktioniert
      const querySnapshot = await getDocs(collection(db, 'documents'))
      const docs = []
      querySnapshot.forEach((d) => {
        docs.push({ id: d.id, ...d.data() })
      })
      setDocuments(docs)
      onDocumentsChange?.(docs)
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err)
    }
  }

  /**
   * Datei-Input Handler
   */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Bitte wählen Sie eine PDF-Datei aus')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  /**
   * Upload-Handler
   */
  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!documentName.trim()) {
      setError('Bitte geben Sie einen Dokumentnamen ein')
      return
    }
    
    if (!file) {
      setError('Bitte wählen Sie eine PDF-Datei aus')
      return
    }

    // Sicherstellen, dass ein angemeldeter Benutzer vorhanden ist
    const user = getCurrentUser()
    if (!user) {
      setError('Bitte zuerst einloggen, um Dokumente hochzuladen')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Speichere Dokument mit Sprache:', language)
      await uploadDocument(file, documentName, language, voiceId)
      
      setSuccess(t('documents.uploadSuccess'))
      setDocumentName('')
      setLanguage('de')
      setVoiceId('21m00Tcm4TlvDq8ikWAM')
      setFile(null)
      
      // Dokumentenliste neu laden
      await loadDocuments()
      
      // Success-Message nach 3 Sekunden ausblenden
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Upload-Fehler:', err)
      setError(t('documents.uploadError') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Dokument löschen
   */
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm(t('documents.deleteConfirm'))) {
      return
    }

    try {
      await deleteDocument(docId)
      await loadDocuments()
    } catch (err) {
      setError('Fehler beim Löschen des Dokuments')
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload-Formular */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('documents.upload')}</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Dokumentname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('documents.documentName')}
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="z.B. Aufklärungsbogen Herzkatheter"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sprache */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('documents.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="tr">Türkisch</option>
              <option value="ru">Russisch</option>
              <option value="ar">Arabisch</option>
              <option value="fa">Persisch (Farsi)</option>
            </select>
          </div>

          {/* Stimme auswählen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stimme auswählen
            </label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          {/* Datei-Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('documents.selectFile')}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                ✓ {file.name}
              </p>
            )}
          </div>

          {/* Submit-Button */}
          <button
            type="submit"
            disabled={loading || !currentUser}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? t('documents.uploading') : t('documents.uploadBtn')}
          </button>
          {!currentUser && (
            <p className="text-sm text-yellow-700 mt-2">Bitte anmelden, um Uploads durchführen zu können.</p>
          )}
        </form>
      </div>

      {/* Dokumentenliste */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('documents.documentList')}</h3>
        
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('dashboard.noDocuments')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('documents.name')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('documents.language')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('documents.createdAt')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('documents.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {doc.language === 'de' ? 'DE' : doc.language === 'en' ? 'EN' : doc.language === 'tr' ? 'TR' : doc.language === 'ru' ? 'RU' : doc.language?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.createdAt?.toDate?.()?.toLocaleDateString?.() || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                      <button
                        onClick={() => onStartReading?.(doc)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {t('documents.startReading', 'Vorlesen starten')}
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        {t('documents.delete')}
                      </button>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
