import React, { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, uploadStudents, deleteStudent, deleteAllStudents } from '@/api/students.api'
import { getDashboardStats } from '@/api/cases.api'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Users, Upload, Loader2, Flag, MonitorSmartphone, GraduationCap, Layout, Eye, Edit2, Trash2, Search, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { StudentModal } from './StudentModal'

export function StudentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students', { q: debouncedSearch, limit: 'all' }],
    queryFn: () => getStudents({ q: debouncedSearch, limit: 'all' })
  })

  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats
  })

  const uploadMutation = useMutation({
    mutationFn: uploadStudents,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['students'] })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload students')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      toast.success('Student deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete student')
    }
  })

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id)
    }
  }

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllStudents,
    onSuccess: () => {
      toast.success('All students deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setCurrentPage(1)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete all students')
    }
  })

  const handleDeleteAll = () => {
    if (window.confirm('Are you absolutely sure you want to delete ALL students? This action cannot be undone.')) {
      deleteAllMutation.mutate()
    }
  }

  // Stats computation
  const closedCasesCount = stats?.closedCasesCount || 0;
  const openCasesCount = stats?.openCasesCount || 0;
  const activeStudentsCount = stats?.activeStudentsCount || students?.length || 0;
  const seenTodayCount = stats?.seenTodayCount || 0;

  // Pagination logic
  const paginatedStudents = useMemo(() => {
    if (!students) return []
    const start = (currentPage - 1) * rowsPerPage
    return students.slice(start, start + rowsPerPage)
  }, [students, currentPage, rowsPerPage])

  const totalPages = students ? Math.ceil(students.length / rowsPerPage) : 1

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-normal text-gray-800 tracking-tight">Profiles</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFF5F5] flex items-center justify-center text-[#FF6B6B]">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Closed Cases</p>
            <p className="text-[32px] font-normal leading-none text-gray-800">{closedCasesCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFF5F5] flex items-center justify-center text-[#FF6B6B]">
            <MonitorSmartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">All Open Cases</p>
            <p className="text-[32px] font-normal leading-none text-gray-800">{openCasesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#4ADE80]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Active Students</p>
            <p className="text-[32px] font-normal leading-none text-gray-800">{activeStudentsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] flex items-center justify-center text-[#C084FC]">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Students Seen Today</p>
            <p className="text-[32px] font-normal leading-none text-gray-800">{seenTodayCount}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Tabs */}
        <div className="border-b border-gray-200/80">
          <div className="flex">
            <button className="px-6 py-3 border-b-[2px] border-[#0052CC] text-[#0052CC] font-medium text-sm">
              Students
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="mt-8">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-medium text-gray-800">All Staff</h2>
              <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {activeStudentsCount}
              </span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>
              
              {isAdmin && (
                <>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                    }}
                  />
                  {/* Subtle upload button to keep functionality without cluttering */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    title="Upload Excel"
                  >
                    {uploadMutation.isPending ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <Upload className="w-[15px] h-[15px]" />}
                  </button>
                  {/* Subtle delete all button */}
                  <button 
                    onClick={handleDeleteAll}
                    disabled={deleteAllMutation.isPending}
                    className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Delete All Students"
                  >
                    <Trash2 className="w-[15px] h-[15px]" />
                  </button>
                  
                  <button 
                    onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white px-5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Student
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-4"><LoadingRows rows={10} cols={6} /></div>
              ) : error ? (
                <div className="py-12"><EmptyState icon={Users} title="Couldn't load students" /></div>
              ) : !students?.length ? (
                <div className="py-12"><EmptyState icon={Users} title="No students found" description="Try adjusting your search term." /></div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-normal">Names</th>
                      <th className="px-6 py-4 font-normal">Admission Code</th>
                      <th className="px-6 py-4 font-normal">Class</th>
                      <th className="px-6 py-4 font-normal">Age</th>
                      <th className="px-6 py-4 font-normal">Gender</th>
                      <th className="px-6 py-4 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/80">
                    {paginatedStudents.map((s, index) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 text-gray-700 text-[13px]">{s.full_name}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{s.admission_code}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{s.grade} {s.class}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{s.age !== null ? `${s.age} years` : '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{s.gender}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => navigate(`/students/${s.id}`)}
                              className="text-gray-700 hover:text-black transition-colors"
                              title="View History"
                            >
                              <Eye className="w-[16px] h-[16px]" />
                            </button>
                            {isAdmin && (
                              <>
                                <button 
                                  onClick={() => { setEditingStudent(s); setIsModalOpen(true); }}
                                  className="text-[#0052CC] hover:text-[#003D99] transition-colors"
                                  title="Edit Student"
                                >
                                  <Edit2 className="w-[16px] h-[16px]" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(s.id)} 
                                  disabled={deleteMutation.isPending}
                                  className="text-[#FF6B6B] hover:text-red-600 transition-colors"
                                  title="Delete Student"
                                >
                                  <Trash2 className="w-[16px] h-[16px]" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {students?.length > 0 && (
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

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={editingStudent}
      />
    </div>
  )
}
