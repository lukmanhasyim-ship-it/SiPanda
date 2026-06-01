import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchSiswaByKelas } from '../services/siswaApi'
import { fetchAllKelas } from '../services/kelasApi'
import { fetchAllMapel } from '../services/mapelApi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UploadForm({ onSubmit, loading }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [nis, setNis] = useState('')
  const [kelas, setKelas] = useState('')
  const [mapel, setMapel] = useState('')
  const [errors, setErrors] = useState({})
  const [dragOver, setDragOver] = useState(false)
  const [siswaList, setSiswaList] = useState([])
  const [siswaTerpilih, setSiswaTerpilih] = useState(null)
  const [nisLoading, setNisLoading] = useState(false)
  const [kelasOptions, setKelasOptions] = useState([])
  const [mapelOptions, setMapelOptions] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchAllKelas().then(setKelasOptions).catch(() => {})
    fetchAllMapel().then(setMapelOptions).catch(() => {})
  }, [])

  useEffect(() => {
    if (kelas) {
      setNisLoading(true)
      setSiswaTerpilih(null)
      setNis('')
      ;(async () => {
        try {
          const data = await fetchSiswaByKelas(kelas)
          setSiswaList(data)
        } catch {
          setSiswaList([])
        } finally {
          setNisLoading(false)
        }
      })()
    } else {
      setSiswaList([])
      setSiswaTerpilih(null)
    }
  }, [kelas])

  const handleFile = useCallback((file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Hanya file gambar yang diizinkan' }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Ukuran file maksimal 10MB' }))
      return
    }

    setImage(file)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.image
      return next
    })

    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleSelectSiswa = (e) => {
    const selectedNis = e.target.value
    setNis(selectedNis)
    const siswa = siswaList.find((s) => s.nis === selectedNis)
    setSiswaTerpilih(siswa || null)
    if (siswa) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.nis
        return next
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!image) newErrors.image = 'Pilih gambar lembar jawaban'
    if (!nis) newErrors.nis = 'Pilih siswa'
    if (!kelas) newErrors.kelas = 'Pilih kelas'
    if (!mapel) newErrors.mapel = 'Pilih mata pelajaran'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      onSubmit({
        imageBase64: base64,
        nis,
        kelas,
        mapel,
        fileName: image.name,
      })
    }
    reader.readAsDataURL(image)
  }

  const resetForm = () => {
    setImage(null)
    setPreview(null)
    setNis('')
    setKelas('')
    setMapel('')
    setSiswaTerpilih(null)
    setSiswaList([])
    setErrors({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Unggah Lembar Jawaban
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={classNames(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            dragOver
              ? 'border-primary bg-primary-light'
              : preview
              ? 'border-secondary bg-secondary-light'
              : 'border-border bg-gray-50 hover:border-primary hover:bg-primary-light/40'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />

          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Preview lembar jawaban"
                className="max-h-52 mx-auto rounded-lg object-contain shadow-sm"
              />
              <p className="text-xs text-text-muted">
                {image?.name} ({(image?.size / 1024 / 1024).toFixed(1)}MB)
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImage(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-xs text-danger hover:text-danger/80 underline"
              >
                Hapus & pilih ulang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary-light flex items-center justify-center">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text">
                  Klik atau drag & drop gambar di sini
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Format: JPG, PNG (maks. 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {errors.image && (
          <p className="mt-2 text-xs text-danger flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.image}
          </p>
        )}
      </div>

      {/* Data Siswa & Penilaian */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-text flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Data Penilaian
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Kelas <span className="text-danger">*</span>
            </label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className={classNames(
                'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-all duration-150 appearance-none',
                errors.kelas ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
              )}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {errors.kelas && (
              <p className="mt-1 text-xs text-danger">{errors.kelas}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Mata Pelajaran <span className="text-danger">*</span>
            </label>
            <select
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className={classNames(
                'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-all duration-150 appearance-none',
                errors.mapel ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
              )}
            >
              <option value="">-- Pilih Mapel --</option>
              {mapelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.mapel && (
              <p className="mt-1 text-xs text-danger">{errors.mapel}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Siswa <span className="text-danger">*</span>
          </label>
          {kelas ? (
            <>
              <select
                value={nis}
                onChange={handleSelectSiswa}
                disabled={nisLoading || siswaList.length === 0}
                className={classNames(
                  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-all duration-150 appearance-none',
                  errors.nis ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20',
                  (nisLoading || siswaList.length === 0) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">
                  {nisLoading ? 'Memuat data...' : '-- Pilih Siswa --'}
                </option>
                {siswaList.map((s) => (
                  <option key={s.nis} value={s.nis}>
                    {s.nis} - {s.nama}
                  </option>
                ))}
              </select>
              {siswaList.length === 0 && !nisLoading && (
                <p className="mt-1 text-xs text-warning">
                  Tidak ada siswa terdaftar untuk kelas {kelas}
                </p>
              )}
            </>
          ) : (
            <div className="w-full px-3 py-2.5 rounded-lg border border-border bg-gray-50 text-sm text-text-muted">
              Pilih kelas terlebih dahulu
            </div>
          )}
          {errors.nis && (
            <p className="mt-1 text-xs text-danger">{errors.nis}</p>
          )}
        </div>

        {siswaTerpilih && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-light/50 rounded-lg text-sm text-primary">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>{siswaTerpilih.nama}</strong> — NIS: {siswaTerpilih.nis}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className={classNames(
            'flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-sm',
            loading
              ? 'bg-primary/60 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark active:scale-[0.98]'
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memproses...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Proses Penilaian
            </span>
          )}
        </button>

        {image && (
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-gray-100 transition-all duration-150"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  )
}
