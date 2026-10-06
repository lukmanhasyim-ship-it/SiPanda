import { useState } from 'react'
import RubrikManager from './RubrikManager'
import SoalManager from './SoalManager'

const TABS = [
  { id: 'rubrik', label: 'Rubrik Penilaian' },
  { id: 'soal', label: 'Kunci Pilihan Ganda' },
]

export default function KeyManagement() {
  const [activeTab, setActiveTab] = useState('rubrik')

  return (
    <div className="space-y-5">
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Manajemen kunci">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div role="tabpanel">
        {activeTab === 'rubrik' ? <RubrikManager /> : <SoalManager />}
      </div>
    </div>
  )
}
