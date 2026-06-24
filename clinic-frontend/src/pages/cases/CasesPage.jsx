import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Search, Plus, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'

export function CasesPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: cases, isLoading, error } = useQuery({
    queryKey: ['cases', { status: statusFilter === 'all' ? undefined : statusFilter, q: search }],
    queryFn: () => getCases({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      q: search 
    })
  })

  // Pagination logic
  const paginatedCases = useMemo(() => {
    if (!cases) return []
    const start = (currentPage - 1) * rowsPerPage
    return cases.slice(start, start + rowsPerPage)
  }, [cases, currentPage, rowsPerPage])

  const totalPages = cases ? Math.ceil(cases.length / rowsPerPage) : 1

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Cases</h1>
          <p className="text-gray-500 mt-2">View and manage all student clinic cases.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Tabs */}
        <div className="border-b border-gray-200/80 flex items-center justify-between">
          <div className="flex">
            <button className="px-6 py-3 border-b-[2px] border-[#0052CC] text-[#0052CC] font-medium text-sm">
              All Cases
            </button>
          </div>
          <div className="flex space-x-2 pb-2">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors ${statusFilter === 'open' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors ${statusFilter === 'closed' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="mt-8">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-medium text-gray-800">Case Directory</h2>
              <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {cases?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search student..." 
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>
              
              <button 
                onClick={() => navigate('/nurse/cases/new')}
                className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white px-5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Case
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-4"><LoadingRows rows={10} cols={6} /></div>
              ) : error ? (
                <div className="py-12"><EmptyState icon={ClipboardList} title="Couldn't load cases" /></div>
              ) : !cases?.length ? (
                <div className="py-12"><EmptyState icon={ClipboardList} title="No cases found" description="Try adjusting your filters or search." /></div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-normal">Case ID</th>
                      <th className="px-6 py-4 font-normal">Student</th>
                      <th className="px-6 py-4 font-normal">Family</th>
                      <th className="px-6 py-4 font-normal">Status</th>
                      <th className="px-6 py-4 font-normal">Lab Status</th>
                      <th className="px-6 py-4 font-normal">Doctor Status</th>
                      <th className="px-6 py-4 font-normal">Date Opened</th>
                      <th className="px-6 py-4 font-normal">Opened By</th>
                      <th className="px-6 py-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/80">
                    {paginatedCases.map(c => (
                      <tr key={c.case_id || c.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 text-gray-500 font-mono text-[13px]">#{c.case_id || c.id}</td>
                        <td className="px-6 py-4 text-gray-700 text-[13px] font-medium flex items-center gap-2">
                          {c.student_full_name}
                          {c.needs_doctor && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                              Escalated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-[13px]">{c.family_name}</td>
                        <td className="px-6 py-4 text-[13px]"><StatusPill status={c.status} /></td>
                        <td className="px-6 py-4 text-[13px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            c.lab_status === 'Ready' ? 'bg-green-50 text-green-700 border-green-200' :
                            c.lab_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {c.lab_status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            c.doctor_status === 'Reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            c.doctor_status === 'Not Reviewed' ? 'bg-red-50 text-red-700 border-red-200' :
                            c.doctor_status === 'Transferred' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {c.doctor_status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{formatRelative(c.created_at)}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{c.opened_by}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => navigate(`/cases/${c.case_id || c.id}`)}
                              className="text-gray-700 hover:text-[#0052CC] transition-colors flex items-center gap-1.5"
                              title="View Case"
                            >
                              <Eye className="w-[16px] h-[16px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {cases?.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-4 text-[13px] text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-gray-300"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronsLeft className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronRight className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronsRight className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
