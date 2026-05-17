import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loginAdmin } from '../services/firebase'

/**
 * Login-Seite für Admin-Benutzer
 * Authentifizierung mit E-Mail und Passwort via Firebase
 */
export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Login-Handler
   */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Firebase-Anmeldung
      await loginAdmin(email, password)
      
      // Zum Dashboard navigieren
      navigate('/admin')
    } catch (err) {
      // Fehlerbehandlung
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(t('login.invalidCredentials'))
      } else if (err.code === 'auth/network-request-failed') {
        setError(t('login.networkError'))
      } else {
        setError(t('login.unknownError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">gelaber2</h1>
          <p className="text-gray-600 text-sm">{t('login.title')}</p>
        </div>

        {/* Fehler-Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold text-sm">{t('login.errorTitle')}</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Login-Formular */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* E-Mail-Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Passwort-Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit-Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 mt-6"
          >
            {loading ? t('login.loggingIn') : t('login.loginBtn')}
          </button>
        </form>

        {/* Info-Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          {t('common.confirm')} credentials required
        </p>
      </div>
    </div>
  )
}
