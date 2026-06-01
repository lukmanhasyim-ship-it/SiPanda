function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getSkorColor(skor, maks) {
  const ratio = skor / maks
  if (ratio >= 0.75) return 'bg-secondary text-white'
  if (ratio >= 0.5) return 'bg-warning text-white'
  return 'bg-danger text-white'
}

function getSkorBg(skor, maks) {
  const ratio = skor / maks
  if (ratio >= 0.75) return 'bg-secondary-light border-secondary/30'
  if (ratio >= 0.5) return 'bg-warning-light border-warning/30'
  return 'bg-danger-light border-danger/30'
}

export default function ResultCard({ data, onReset }) {
  if (!data) return null

  const {
    namaSiswa,
    nis,
    kelas,
    mapel,
    timestamp,
    hasilOCR,
    skorAnalitik = [],
    totalSkor = 0,
    totalMaks = 0,
    feedbackAI,
    rekomendasi,
  } = data

  const persentase = totalMaks > 0 ? Math.round((totalSkor / totalMaks) * 100) : 0

  const getGrade = (pct) => {
    if (pct >= 85) return { label: 'Sangat Baik', color: 'text-secondary' }
    if (pct >= 70) return { label: 'Baik', color: 'text-primary' }
    if (pct >= 55) return { label: 'Cukup', color: 'text-warning' }
    return { label: 'Kurang', color: 'text-danger' }
  }

  const grade = getGrade(persentase)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header Hasil */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary-light flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-text">Hasil Penilaian</h2>
          </div>
          <span className="text-xs text-text-muted">
            {new Date(timestamp).toLocaleString('id-ID')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoItem label="Nama" value={namaSiswa} />
          <InfoItem label="NIS" value={nis} />
          <InfoItem label="Kelas" value={kelas} />
          <InfoItem label="Mapel" value={mapel} />
        </div>
      </div>

      {/* Skor Total */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-secondary/20 mb-3">
          <span className={classNames('text-3xl font-bold', grade.color)}>
            {persentase}
            <span className="text-sm font-normal">%</span>
          </span>
        </div>
        <p className={classNames('text-sm font-semibold', grade.color)}>{grade.label}</p>
        <p className="text-xs text-text-muted mt-1">
          {totalSkor} / {totalMaks} poin
        </p>
      </div>

      {/* Skor Analitik */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Skor per Aspek
        </h3>

        <div className="space-y-3">
          {skorAnalitik.map((aspek, idx) => (
            <div
              key={idx}
              className={classNames(
                'rounded-lg border p-4',
                getSkorBg(aspek.skor, aspek.skorMaks)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text">{aspek.aspek}</span>
                <span
                  className={classNames(
                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                    getSkorColor(aspek.skor, aspek.skorMaks)
                  )}
                >
                  {aspek.skor}/{aspek.skorMaks}
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-1.5">
                <div
                  className={classNames(
                    'h-1.5 rounded-full transition-all duration-500',
                    aspek.skor / aspek.skorMaks >= 0.75
                      ? 'bg-secondary'
                      : aspek.skor / aspek.skorMaks >= 0.5
                      ? 'bg-warning'
                      : 'bg-danger'
                  )}
                  style={{ width: `${(aspek.skor / aspek.skorMaks) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">{aspek.deskriptor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teks OCR */}
      {hasilOCR && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Hasil Ekstraksi Teks (OCR)
          </h3>
          <pre className="text-xs text-text-muted whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-3 border border-border leading-relaxed">
            {hasilOCR}
          </pre>
        </div>
      )}

      {/* Feedback AI */}
      {feedbackAI && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Feedback AI
          </h3>
          <div className="text-sm text-text leading-relaxed space-y-1">
            {feedbackAI.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {rekomendasi && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-text-muted mb-1">Rekomendasi:</p>
              <p className="text-sm text-text">{rekomendasi}</p>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all duration-150 shadow-sm active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Penilaian Baru
        </button>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{value || '-'}</p>
    </div>
  )
}
