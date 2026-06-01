import { useState, useEffect } from 'react'
import { fetchRiwayatHasil } from '../services/hasilApi'
import HistoryDetailModal from './HistoryDetailModal'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function History({ onViewDetail }) {
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchRiwayatHasil(50)
        setRiwayat(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  let content

  if (loading) {
    content = (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-primary-light animate-spin border-t-primary shadow-sm" />
          <p className="mt-4 text-sm text-text-muted">Memuat riwayat...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto rounded-full bg-danger-light flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text">Gagal memuat riwayat</h3>
        <p className="text-xs text-text-muted mt-1">{error}</p>
      </div>
    )
  } else if (riwayat.length === 0) {
    content = (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text">Belum ada riwayat</h3>
        <p className="text-xs text-text-muted mt-1">Hasil penilaian akan muncul di sini</p>
      </div>
    )
  } else {
    content = (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Riwayat Penilaian
          </h2>
          <span className="text-xs text-text-muted">{riwayat.length} data</span>
        </div>

        {riwayat.map((item, idx) => {
          const persentase = Math.round((item.totalSkor / item.totalMaks) * 100)
          return (
            <div
              key={item.timestamp + '-' + idx}
              className="bg-surface rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary/30 transition-all duration-150 cursor-pointer"
              onClick={() => setDetailItem(item)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text">{item.namaSiswa}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>NIS: {item.nis}</span>
                    <span>{item.kelas}</span>
                    <span>{item.mapel}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {new Date(item.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={classNames(
                      'inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold',
                      persentase >= 75
                        ? 'bg-secondary-light text-secondary'
                        : persentase >= 50
                        ? 'bg-warning-light text-warning'
                        : 'bg-danger-light text-danger'
                    )}
                  >
                    {persentase}%
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={classNames(
                      'h-1.5 rounded-full',
                      persentase >= 75
                        ? 'bg-secondary'
                        : persentase >= 50
                        ? 'bg-warning'
                        : 'bg-danger'
                    )}
                    style={{ width: `${persentase}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">
                  {item.totalSkor}/{item.totalMaks}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <HistoryDetailModal data={detailItem} onClose={() => setDetailItem(null)} />
      {content}
    </>
  )
}
