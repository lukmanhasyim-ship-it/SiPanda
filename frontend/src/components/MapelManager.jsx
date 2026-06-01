import { useState, useEffect } from 'react'
import { fetchAllMapel, addMapel, deleteMapel } from '../services/mapelApi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MapelManager() {
  const [mapelList, setMapelList] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMapel, setNewMapel] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchAllMapel()
      setMapelList(data)
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

  const handleAdd = async () => {
    if (!newMapel.trim()) return
    try {
      await addMapel(newMapel.trim())
      showToast(`Mapel ${newMapel.trim()} berhasil ditambahkan`)
      setNewMapel('')
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (mapel) => {
    if (!window.confirm(`Hapus mapel ${mapel}?`)) return
    try {
      await deleteMapel(mapel)
      showToast(`Mapel ${mapel} berhasil dihapus`)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className={classNames(
          'fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
          toast.type === 'error' ? 'bg-danger text-white' : 'bg-secondary text-white'
        )}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Manajemen Mata Pelajaran
        </h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMapel}
          onChange={(e) => setNewMapel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nama mapel baru..."
          className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <button
          onClick={handleAdd}
          disabled={!newMapel.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Tambah
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-text-muted">Memuat data...</div>
      ) : mapelList.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">Belum ada mapel</div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Nama Mapel</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mapelList.map((m, i) => (
                  <tr key={m} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text">{m}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(m)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/50 transition-colors" title="Hapus">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-gray-50/50 text-xs text-text-muted text-right">
            Total: {mapelList.length} mapel
          </div>
        </div>
      )}
    </div>
  )
}
