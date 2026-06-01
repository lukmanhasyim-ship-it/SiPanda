import { useState, useEffect } from 'react'
import { fetchAllKelas } from '../services/kelasApi'
import { fetchAllMapel } from '../services/mapelApi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const emptyAspek = () => ({
  nama: '',
  skor_4: '',
  skor_3: '',
  skor_2: '',
  skor_1: '',
})

export default function RubrikFormModal({ open, rubrik, onSave, onClose }) {
  const isEdit = !!rubrik
  const [kelas, setKelas] = useState('')
  const [mapel, setMapel] = useState('')
  const [aspekList, setAspekList] = useState([emptyAspek()])
  const [errors, setErrors] = useState({})
  const [kelasOptions, setKelasOptions] = useState([])
  const [mapelOptions, setMapelOptions] = useState([])

  useEffect(() => {
    fetchAllKelas().then(setKelasOptions).catch(() => {})
    fetchAllMapel().then(setMapelOptions).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      if (rubrik) {
        setKelas(rubrik.kelas)
        setMapel(rubrik.mapel)
        setAspekList(
          rubrik.aspek.length > 0
            ? rubrik.aspek.map((a) => ({ ...a }))
            : [emptyAspek()]
        )
      } else {
        setKelas('')
        setMapel('')
        setAspekList([emptyAspek()])
      }
      setErrors({})
    }
  }, [open, rubrik])

  const handleAspekChange = (idx, field, value) => {
    setAspekList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const addAspek = () => {
    setAspekList((prev) => [...prev, emptyAspek()])
  }

  const removeAspek = (idx) => {
    if (aspekList.length <= 1) return
    setAspekList((prev) => prev.filter((_, i) => i !== idx))
  }

  const validate = () => {
    const errs = {}
    if (!kelas) errs.kelas = 'Pilih kelas'
    if (!mapel) errs.mapel = 'Pilih mata pelajaran'

    const validAspek = aspekList.filter((a) => a.nama.trim())
    if (validAspek.length === 0) {
      errs.aspek = 'Minimal satu aspek penilaian diperlukan'
    }

    validAspek.forEach((a, i) => {
      if (!a.skor_4.trim()) errs[`skor_4_${i}`] = 'Required'
      if (!a.skor_3.trim()) errs[`skor_3_${i}`] = 'Required'
      if (!a.skor_2.trim()) errs[`skor_2_${i}`] = 'Required'
      if (!a.skor_1.trim()) errs[`skor_1_${i}`] = 'Required'
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const filteredAspek = aspekList
      .filter((a) => a.nama.trim())
      .map((a) => ({
        nama: a.nama.trim(),
        skor_4: a.skor_4.trim(),
        skor_3: a.skor_3.trim(),
        skor_2: a.skor_2.trim(),
        skor_1: a.skor_1.trim(),
      }))

    onSave({ kelas, mapel, aspek: filteredAspek })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 pb-8">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">
            {isEdit ? 'Edit Rubrik' : 'Tambah Rubrik Baru'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Kelas <span className="text-danger">*</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className={classNames(
                  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm appearance-none',
                  errors.kelas ? 'border-danger ring-1 ring-danger/20' : 'border-border'
                )}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              {errors.kelas && <p className="mt-1 text-xs text-danger">{errors.kelas}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Mata Pelajaran <span className="text-danger">*</span>
              </label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className={classNames(
                  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm appearance-none',
                  errors.mapel ? 'border-danger ring-1 ring-danger/20' : 'border-border'
                )}
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.mapel && <p className="mt-1 text-xs text-danger">{errors.mapel}</p>}
            </div>
          </div>

          {/* Aspek */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text">
                Aspek Penilaian <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={addAspek}
                className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Aspek
              </button>
            </div>

            {errors.aspek && (
              <p className="mb-2 text-xs text-danger">{errors.aspek}</p>
            )}

            <div className="space-y-4">
              {aspekList.map((aspek, idx) => (
                <div key={idx} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Aspek #{idx + 1}
                    </span>
                    {aspekList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAspek(idx)}
                        className="text-xs text-danger hover:text-danger/80"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Nama aspek (contoh: Tata Bahasa)"
                      value={aspek.nama}
                      onChange={(e) => handleAspekChange(idx, 'nama', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[4, 3, 2, 1].map((skor) => (
                      <div key={skor}>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Skor {skor}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={`Deskriptor untuk level ${skor === 4 ? 'Sangat Baik' : skor === 3 ? 'Baik' : skor === 2 ? 'Cukup' : 'Kurang'}`}
                          value={aspek[`skor_${skor}`]}
                          onChange={(e) => handleAspekChange(idx, `skor_${skor}`, e.target.value)}
                          className={classNames(
                            'w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none',
                            errors[`skor_${skor}_${idx}`] ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah Rubrik'}
          </button>
        </div>
      </div>
    </div>
  )
}
