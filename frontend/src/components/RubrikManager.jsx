import { useState, useEffect } from 'react'
import { fetchAllRubrik, addRubrik, updateRubrik, deleteRubrik, importRubrik } from '../services/rubrikApi'
import RubrikFormModal from './RubrikFormModal'
import ImportModal from './ImportModal'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function RubrikManager() {
  const [rubrikList, setRubrikList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRubrik, setEditRubrik] = useState(null)
  const [filterKelas, setFilterKelas] = useState('')
  const [filterMapel, setFilterMapel] = useState('')
  const [toast, setToast] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchAllRubrik()
      setRubrikList(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = () => {
    setEditRubrik(null)
    setModalOpen(true)
  }

  const handleEdit = (rubrik) => {
    setEditRubrik(rubrik)
    setModalOpen(true)
  }

  const handleSave = async ({ kelas, mapel, aspek }) => {
    try {
      if (editRubrik) {
        await updateRubrik(editRubrik.kelas, editRubrik.mapel, { kelasBaru: kelas, mapelBaru: mapel, aspek })
        showToast(`Rubrik ${kelas} - ${mapel} berhasil diperbarui`)
      } else {
        await addRubrik({ kelas, mapel, aspek })
        showToast(`Rubrik ${kelas} - ${mapel} berhasil ditambahkan`)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (rubrik) => {
    if (!window.confirm(`Hapus rubrik untuk ${rubrik.kelas} - ${rubrik.mapel}?`)) return
    try {
      await deleteRubrik(rubrik.kelas, rubrik.mapel)
      showToast(`Rubrik ${rubrik.kelas} - ${rubrik.mapel} berhasil dihapus`)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filteredList = rubrikList.filter((r) => {
    if (filterKelas && r.kelas !== filterKelas) return false
    if (filterMapel && r.mapel !== filterMapel) return false
    return true
  })

  const kelasOptions = [...new Set(rubrikList.map((r) => r.kelas))].sort()
  const mapelOptions = [...new Set(rubrikList.map((r) => r.mapel))].sort()

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={classNames(
            'fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300',
            toast.type === 'error' ? 'bg-danger text-white' : 'bg-secondary text-white'
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Manajemen Rubrik
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {rubrikList.length} rubrik tersedia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Rubrik
          </button>
        </div>
      </div>

      {/* Filter */}
      {rubrikList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm bg-white appearance-none"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm bg-white appearance-none"
          >
            <option value="">Semua Mapel</option>
            {mapelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {(filterKelas || filterMapel) && (
            <button
              onClick={() => { setFilterKelas(''); setFilterMapel('') }}
              className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text border border-border hover:bg-gray-50 transition-colors"
            >
              Hapus Filter
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-primary-light animate-spin border-t-primary shadow-sm" />
            <p className="mt-3 text-sm text-text-muted">Memuat rubrik...</p>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text">Belum ada rubrik</h3>
          <p className="text-xs text-text-muted mt-1">
            {rubrikList.length === 0
              ? 'Klik "Tambah Rubrik" untuk membuat rubrik penilaian pertama'
              : 'Tidak ada rubrik yang sesuai filter'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredList.map((rubrik) => (
            <div
              key={rubrik.kelas + '-' + rubrik.mapel}
              className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-150"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {rubrik.kelas}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-light text-accent">
                        {rubrik.mapel}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {rubrik.aspek.length} aspek penilaian
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(rubrik)}
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light/50 transition-colors"
                      title="Edit rubrik"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(rubrik)}
                      className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/50 transition-colors"
                      title="Hapus rubrik"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Aspek list */}
                <div className="mt-4 space-y-2">
                  {rubrik.aspek.map((aspek, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text">{aspek.nama}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[4, 3, 2, 1].map((skor) => (
                          <div key={skor} className="text-xs">
                            <span className="font-medium text-text-muted">Skor {skor}: </span>
                            <span className="text-text">{aspek[`skor_${skor}`]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <RubrikFormModal
        open={modalOpen}
        rubrik={editRubrik}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <ImportModal
        open={importOpen}
        type="rubrik"
        onImport={async (rows) => {
          await importRubrik(rows)
          showToast(`${rows.length} rubrik berhasil diimport`)
          setImportOpen(false)
          loadData()
        }}
        onClose={() => setImportOpen(false)}
      />
    </div>
  )
}
