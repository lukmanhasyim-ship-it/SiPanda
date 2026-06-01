function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

export default function HistoryDetailModal({ data, onClose }) {
  if (!data) return null

  const persentase = Math.round((data.totalSkor / data.totalMaks) * 100)
  let skorAnalitik = []
  if (typeof data.skorAnalitik === 'string') {
    try { skorAnalitik = JSON.parse(data.skorAnalitik) } catch {}
  } else if (Array.isArray(data.skorAnalitik)) {
    skorAnalitik = data.skorAnalitik
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 pb-8">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text">Detail Penilaian</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">{data.namaSiswa}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-text-muted">
                <span>NIS: {data.nis}</span>
                <span>{data.kelas}</span>
                <span>{data.mapel}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">{formatDate(data.timestamp)}</p>
            </div>
            <div className="text-center">
              <div className={classNames(
                'w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold',
                persentase >= 75 ? 'bg-secondary-light text-secondary' :
                persentase >= 50 ? 'bg-warning-light text-warning' :
                'bg-danger-light text-danger'
              )}>
                {persentase}%
              </div>
              <p className="text-xs text-text-muted mt-1">{data.totalSkor}/{data.totalMaks}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text">Progress Skor</h4>
              <span className="text-xs text-text-muted">{persentase}%</span>
            </div>
            <div className="bg-white rounded-full h-2.5 border border-border">
              <div className={classNames(
                'h-2.5 rounded-full transition-all',
                persentase >= 75 ? 'bg-secondary' :
                persentase >= 50 ? 'bg-warning' :
                'bg-danger'
              )} style={{ width: `${persentase}%` }} />
            </div>
          </div>

          {skorAnalitik.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-3">Skor Analitik</h4>
              <div className="space-y-3">
                {skorAnalitik.map((aspek, idx) => (
                  <div key={idx} className="border border-border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text">{aspek.aspek || aspek.nama || `Aspek #${idx + 1}`}</span>
                      <span className={classNames(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
                        aspek.skor >= 4 ? 'bg-secondary-light text-secondary' :
                        aspek.skor >= 3 ? 'bg-primary-light text-primary' :
                        aspek.skor >= 2 ? 'bg-warning-light text-warning' :
                        'bg-danger-light text-danger'
                      )}>
                        {aspek.skor}/{aspek.skorMaks || 4}
                      </span>
                    </div>
                    {aspek.deskriptor && (
                      <p className="text-xs text-text-muted mb-2 italic">"{aspek.deskriptor}"</p>
                    )}
                    {aspek.feedback && (
                      <p className="text-xs text-text">{aspek.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.feedbackAI && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Feedback</h4>
              <div className="bg-primary-light/30 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-text whitespace-pre-wrap">{data.feedbackAI}</p>
              </div>
            </div>
          )}

          {data.rekomendasi && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Rekomendasi</h4>
              <div className="bg-accent-light/30 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-text whitespace-pre-wrap">{data.rekomendasi}</p>
              </div>
            </div>
          )}

          {data.hasilOCR && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Hasil OCR</h4>
              <div className="bg-gray-50 border border-border rounded-xl p-4">
                <p className="text-xs text-text font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {data.hasilOCR}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-gray-100 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
