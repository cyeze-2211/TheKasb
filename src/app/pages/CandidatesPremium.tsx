import { useState, useMemo } from 'react';
import { Search, ChevronDown, X, Download, Eye, Edit, MoreVertical, Settings } from 'lucide-react';
import { mockCandidates, REGIONS, COUNTRIES } from '../data/mockData';
import { Link } from 'react-router';
import { LanguageIcon } from '../components/LanguageIcon';

const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-amber-600',
    'bg-red-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400 from-green-600 to-green-400';
  if (score >= 50) return 'text-amber-400 from-amber-600 to-amber-400';
  return 'text-red-400 from-red-600 to-red-400';
};

const getLevelColor = (level: string) => {
  if (level.startsWith('A')) return 'bg-gray-700 text-gray-300 border-gray-600';
  if (level.startsWith('B')) return 'bg-blue-900/30 text-blue-300 border-blue-700';
  return 'bg-green-900/30 text-green-300 border-green-700';
};

export function CandidatesPremium() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const stats = {
    total: 10847,
    approved: 4552,
    pending: 3798,
    reviewing: 1641,
    rejected: 856
  };

  const experienceLabels: any = {
    YEAR_1_3: '1–3 yil',
    YEAR_3_5: '3–5 yil',
    YEAR_5_PLUS: '5+ yil'
  };

  const experienceColors: any = {
    YEAR_1_3: 'border-gray-600 text-gray-300',
    YEAR_3_5: 'border-blue-600 text-blue-300',
    YEAR_5_PLUS: 'border-purple-600 text-purple-300'
  };

  const statusConfig: any = {
    PENDING: {
      label: 'KUTILMOQDA',
      bg: 'bg-amber-950/50',
      text: 'text-amber-300',
      border: 'border-amber-700',
      dot: 'bg-amber-400'
    },
    REVIEWING: {
      label: 'KO\'RIB CHIQILMOQDA',
      bg: 'bg-blue-950/50',
      text: 'text-blue-300',
      border: 'border-blue-700',
      dot: 'bg-blue-400'
    },
    APPROVED: {
      label: 'TASDIQLANGAN',
      bg: 'bg-green-950/50',
      text: 'text-green-300',
      border: 'border-green-700',
      dot: 'bg-green-400'
    },
    REJECTED: {
      label: 'RAD ETILGAN',
      bg: 'bg-red-950/50',
      text: 'text-red-300',
      border: 'border-red-700',
      dot: 'bg-red-400'
    }
  };

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--dashboard-bg)' }}>
      {/* Zone 1: Smart Filter Bar */}
      <div className="border-b" style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ism, telefon raqam yoki kasb..."
                className="w-full h-10 pl-10 pr-4 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex-1 flex items-center gap-2">
              {/* Example chips - would be dynamic */}
            </div>

            {/* Right Actions */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-4 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Settings size={14} />
              Filtrlar
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="h-9 px-4 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 text-sm flex items-center gap-2">
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 space-y-3 pb-2">
              <div className="grid grid-cols-4 gap-3">
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Holat — Barchasi</option>
                  <option>PENDING</option>
                  <option>REVIEWING</option>
                  <option>APPROVED</option>
                  <option>REJECTED</option>
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Viloyat — Barchasi</option>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Kasb kategoriyasi</option>
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Kasb</option>
                </select>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Tajriba</option>
                  <option>1-3 yil</option>
                  <option>3-5 yil</option>
                  <option>5+ yil</option>
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Mavjudligi</option>
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Maqsad mamlakat</option>
                </select>
                <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500">
                  <option>Agent</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2A: Stats Strip */}
      <div className="h-10 px-6 flex items-center gap-6 text-xs border-b" style={{ backgroundColor: '#0D1117', borderColor: '#1F2937' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Jami:</span>
          <span className="text-white font-bold">{stats.total.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-gray-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-gray-400">Tasdiqlangan:</span>
          <span className="text-white font-bold">{stats.approved.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-gray-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-gray-400">Kutilmoqda:</span>
          <span className="text-white font-bold">{stats.pending.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-gray-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="text-gray-400">Ko'rib chiqilmoqda:</span>
          <span className="text-white font-bold">{stats.reviewing.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-gray-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span className="text-gray-400">Rad etilgan:</span>
          <span className="text-white font-bold">{stats.rejected.toLocaleString()}</span>
        </div>
      </div>

      {/* Zone 2B: Toolbar */}
      <div className="h-13 px-6 flex items-center justify-between border-b" style={{ borderColor: '#1F2937' }}>
        <div className="text-white font-semibold">
          {mockCandidates.length.toLocaleString()} ta nomzod
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-900/20 border border-blue-700">
            <span className="text-blue-300 text-sm">{selectedRows.length} ta tanlandi</span>
            <button className="text-sm text-blue-300 hover:text-blue-200">Status ▾</button>
            <button className="text-sm text-blue-300 hover:text-blue-200">Agent ▾</button>
            <button onClick={() => setSelectedRows([])} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-lg bg-gray-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-xs ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              ☰ Jadval
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded text-xs ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              ⊞ Karta
            </button>
          </div>
          <select className="h-9 px-3 rounded-lg text-sm text-white bg-gray-800 border border-gray-700">
            <option>20</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="text-sm text-gray-400">Page: 1 / 542</span>
        </div>
      </div>

      {/* Zone 3: Table/Card View */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'table' ? (
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: '#161D2E' }}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="w-4 h-4 rounded bg-gray-700 border-gray-600" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">NOMZOD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">JOYLASHUV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">KASB</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">TAJRIBA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">TILLAR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">MAMLAKAT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">MAOSH</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">BALL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">HOLAT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">SANA</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: '#1F2937' }}>
              {mockCandidates.map((candidate, idx) => {
                const isSelected = selectedRows.includes(candidate.id);
                const scoreColors = getScoreColor(candidate.score);
                const statusStyle = statusConfig[candidate.status];

                return (
                  <tr
                    key={candidate.id}
                    className={`h-16 transition-colors ${isSelected ? 'bg-blue-950/30' : idx % 2 === 0 ? 'bg-[#111827]' : 'bg-[#0F1729]'} hover:bg-[#1A2235] border-l-2 ${isSelected ? 'border-l-blue-500' : 'border-l-transparent'}`}
                    style={{ borderLeftWidth: isSelected ? '3px' : '2px' }}
                  >
                    <td className="px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(candidate.id)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(candidate.name)} flex items-center justify-center text-white text-xs font-semibold`}>
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{candidate.name}</div>
                          <div className="text-xs mono text-gray-400">{candidate.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">{candidate.region.split(' ')[0]}<br/>{candidate.region.split(' ').slice(1).join(' ')}</td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-400">{candidate.category}</div>
                      <div className="text-sm text-white">{candidate.profession}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${experienceColors[candidate.experience]}`}>
                        {experienceLabels[candidate.experience]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {candidate.languages.slice(0, 3).map((lang, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${getLevelColor(lang.level)}`}
                          >
                            <LanguageIcon code={lang.lang} size={14} className="text-gray-200" />
                            {lang.level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {candidate.targetCountries.map(code => {
                          const country = COUNTRIES.find(c => c.code === code);
                          return <span key={code} className="text-lg">{country?.flag}</span>;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white font-semibold">${candidate.salaryMin.toLocaleString()}–${candidate.salaryMax.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{candidate.currency}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-24">
                        <div className={`flex items-center gap-2 mb-1 ${scoreColors.split(' ')[0]}`}>
                          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${scoreColors.split(' ').slice(1).join(' ')}`} style={{ width: `${candidate.score}%` }}></div>
                          </div>
                          <span className="text-xs font-bold">{candidate.score}%</span>
                        </div>
                        <div className="text-[10px] text-gray-500">To'liqlik</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${candidate.status === 'PENDING' || candidate.status === 'REVIEWING' ? 'animate-pulse' : ''}`}></span>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs mono text-white">{candidate.registeredAt}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => setSelectedCandidate(candidate)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700">
                          <Eye size={14} className="text-gray-400" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700">
                          <Edit size={14} className="text-gray-400" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700">
                          <MoreVertical size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-3 gap-6 p-6">
            {mockCandidates.map((candidate) => {
              const statusStyle = statusConfig[candidate.status];
              return (
                <div
                  key={candidate.id}
                  className="h-56 p-4 rounded-lg border border-gray-700 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                  style={{ backgroundColor: '#111827' }}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(candidate.name)} flex items-center justify-center text-white text-sm font-bold`}>
                        {getInitials(candidate.name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{candidate.name}</div>
                        <div className="text-xs mono text-gray-400">{candidate.phone}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mb-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>📍 {candidate.region.split(' ')[0]}</span>
                      <span>|</span>
                      <span>🍽 {candidate.profession}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {candidate.languages.map((lang, i) => (
                        <span key={i} className="inline-flex items-center gap-0.5 text-xs text-gray-300">
                          <LanguageIcon code={lang.lang} size={13} className="text-gray-400" />
                          {lang.level}
                        </span>
                      ))}
                      <span className="mx-1">→</span>
                      {candidate.targetCountries.map(code => {
                        const country = COUNTRIES.find(c => c.code === code);
                        return <span key={code}>{country?.flag}</span>;
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>${candidate.salaryMin.toLocaleString()}–${candidate.salaryMax.toLocaleString()} {candidate.currency}</span>
                      <span>|</span>
                      <span>{experienceLabels[candidate.experience]}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Ball:</span>
                      <span className={getScoreColor(candidate.score).split(' ')[0]}>{candidate.score}%</span>
                    </div>
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${getScoreColor(candidate.score).split(' ').slice(1).join(' ')}`} style={{ width: `${candidate.score}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Drawer */}
      {selectedCandidate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedCandidate(null)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-[480px] z-50 flex flex-col" style={{ backgroundColor: '#111827', borderLeft: '2px solid #3B82F6' }}>
            <div className="p-6 border-b" style={{ borderColor: '#1F2937' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedCandidate.name)} flex items-center justify-center text-white font-bold`}>
                    {getInitials(selectedCandidate.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedCandidate.name}</h2>
                    <div className="text-sm mono text-gray-400">{selectedCandidate.phone}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${statusConfig[selectedCandidate.status].bg} ${statusConfig[selectedCandidate.status].text} ${statusConfig[selectedCandidate.status].border}`}>
                {statusConfig[selectedCandidate.status].label}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="text-center mb-6">
                <div className="inline-block relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="#1F2937" strokeWidth="6" fill="none" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#10B981"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - selectedCandidate.score / 100)}`}
                      className="transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{selectedCandidate.score}%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Profil to'liqligi</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="text-xs text-gray-400 mb-1">Viloyat</div>
                  <div className="text-sm text-white">{selectedCandidate.region}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="text-xs text-gray-400 mb-1">Kasb</div>
                  <div className="text-sm text-white">{selectedCandidate.profession}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="text-xs text-gray-400 mb-1">Tajriba</div>
                  <div className="text-sm text-white">{experienceLabels[selectedCandidate.experience]}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="text-xs text-gray-400 mb-1">Maosh</div>
                  <div className="text-sm text-white">${selectedCandidate.salaryMin.toLocaleString()}–${selectedCandidate.salaryMax.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: '#1F2937' }}>
              <Link
                to={`/admin/candidates/${selectedCandidate.id}`}
                className="w-full h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
              >
                To'liq sahifa →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
