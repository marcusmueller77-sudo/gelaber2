import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createPatient,
  getPatients,
  deletePatient,
  assignDocumentToPatient
} from '../services/firebase'

/**
 * PatientManager-Komponente
 * Ermöglicht Admin, Patienten zu erstellen und zu verwalten
 */
export default function PatientManager({ documents, onPatientsChange, onStartSession }) {
  const { t } = useTranslation()
  
  const [patients, setPatients] = useState([])
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedPatientForAssign, setSelectedPatientForAssign] = useState('')
  const [selectedDocumentForAssign, setSelectedDocumentForAssign] = useState('')

  // Patientenliste beim Mount laden
  useEffect(() => {
    loadPatients()
  }, [])

  /**
   * Alle Patienten laden
   */
  const loadPatients = async () => {
    try {
      const pats = await getPatients()
      setPatients(pats)
      onPatientsChange?.(pats)
    } catch (err) {
      console.error('Fehler beim Laden der Patienten:', err)
    }
  }

  /**
   * Neuen Patienten erstellen
   */
  const handleCreatePatient = async (e) => {
    e.preventDefault()
    
    if (!patientName.trim()) {
      setError('Bitte geben Sie einen Patientennamen ein')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await createPatient(patientName)
      
      setSuccess(t('patients.createSuccess'))
      setPatientName('')
      
      // Patientenliste neu laden
      await loadPatients()
      
      // Success-Message nach 3 Sekunden ausblenden
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Fehler beim Erstellen des Patienten:', err)
      setError(t('patients.createError'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Dokument zu Patient zuweisen
   */
  const handleAssignDocument = async () => {
    if (!selectedPatientForAssign || !selectedDocumentForAssign) {
      setError('Bitte wählen Sie einen Patienten und ein Dokument aus')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await assignDocumentToPatient(selectedPatientForAssign, selectedDocumentForAssign)
      
      setSuccess(t('patients.assignSuccess'))
      setSelectedPatientForAssign('')
      setSelectedDocumentForAssign('')
      
      // Patientenliste neu laden
      await loadPatients()
      
      // Success-Message nach 3 Sekunden ausblenden
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Fehler beim Zuweisen des Dokuments:', err)
      setError(t('patients.assignError'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Patienten löschen
   */
  const handleDeletePatient = async (patientId) => {
    if (!window.confirm(t('patients.deleteConfirm'))) {
      return
    }

    try {
      await deletePatient(patientId)
      await loadPatients()
    } catch (err) {
      setError('Fehler beim Löschen des Patienten')
    }
  }

  /**
   * Sitzung für Patient starten
   */
  const handleStartSession = (patient) => {
    if (!patient.assignedDocumentId) {
      setError('Diesem Patienten ist noch kein Dokument zugewiesen')
      return
    }
    
    onStartSession?.(patient)
  }

  return (
    <div className="space-y-6">
      {/* Neuen Patienten erstellen */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('patients.addPatient')}</h3>
        
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

        <form onSubmit={handleCreatePatient} className="space-y-4">
          {/* Patientenname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('patients.patientName')}
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit-Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? t('patients.creating') : t('patients.createBtn')}
          </button>
        </form>
      </div>

      {/* Dokument zuweisen */}
      {documents && documents.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('patients.assignDocument')}</h3>
          
          <div className="space-y-4">
            {/* Patient-Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.patientList')}
              </label>
              <select
                value={selectedPatientForAssign}
                onChange={(e) => setSelectedPatientForAssign(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- {t('common.confirm')} --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document-Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('documents.documentList')}
              </label>
              <select
                value={selectedDocumentForAssign}
                onChange={(e) => setSelectedDocumentForAssign(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- {t('common.confirm')} --</option>
                {documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign-Button */}
            <button
              onClick={handleAssignDocument}
              disabled={loading || !selectedPatientForAssign || !selectedDocumentForAssign}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? t('patients.assigning') : t('patients.assign')}
            </button>
          </div>
        </div>
      )}

      {/* Patientenliste */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('patients.patientList')}</h3>
        
        {patients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('dashboard.noPatients')}</p>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => {
              const assignedDoc = documents?.find(d => d.id === patient.assignedDocumentId)
              
              return (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{patient.name}</p>
                    <p className="text-sm text-gray-600">
                      {assignedDoc ? `${t('patients.document')}: ${assignedDoc.name}` : t('patients.noDocumentAssigned')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartSession(patient)}
                      disabled={!patient.assignedDocumentId}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                    >
                      {t('patients.startSession')}
                    </button>
                    
                    <button
                      onClick={() => handleDeletePatient(patient.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition"
                    >
                      {t('patients.delete')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
