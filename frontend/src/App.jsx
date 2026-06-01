import { useState } from 'react'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import UploadForm from './components/UploadForm'
import ResultCard from './components/ResultCard'
import LoadingSpinner from './components/LoadingSpinner'
import History from './components/History'
import RubrikManager from './components/RubrikManager'
import SiswaManager from './components/SiswaManager'
import KelasManager from './components/KelasManager'
import MapelManager from './components/MapelManager'
import { processAnswer } from './services/hasilApi'
import { isLoggedIn } from './services/authStore'

export default function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn())
  const [activeNav, setActiveNav] = useState('upload')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await processAnswer(formData)
      if (response.success) {
        setResult(response.data)
      } else {
        setError(response.error || 'Gagal memproses penilaian')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memproses penilaian')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setActiveNav('upload')
  }

  const renderContent = () => {
    if (activeNav === 'siswa') {
      return <SiswaManager />
    }

    if (activeNav === 'rubrik') {
      return <RubrikManager />
    }

    if (activeNav === 'history') {
      return <History />
    }

    if (activeNav === 'kelas') {
      return <KelasManager />
    }

    if (activeNav === 'mapel') {
      return <MapelManager />
    }

    if (result) {
      return <ResultCard data={result} onReset={handleReset} />
    }

    return (
      <div>
        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-danger-light border border-danger/30 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-danger">Gagal Memproses</p>
              <p className="text-xs text-danger/80 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 rounded hover:bg-danger/10 transition-colors"
            >
              <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Menganalisis jawaban siswa..." />
        ) : (
          <UploadForm onSubmit={handleSubmit} loading={loading} />
        )}
      </div>
    )
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={() => setAuthenticated(true)} />
  }

  return (
    <Layout activeNav={activeNav} onNavChange={setActiveNav} onLogout={() => setAuthenticated(false)}>
      {renderContent()}
    </Layout>
  )
}
