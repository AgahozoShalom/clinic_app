import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { getStudents } from '@/api/students.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Search, ClipboardList } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'
import { useAuth } from '@/hooks'

export function NurseDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['students', 'search', debouncedSearch],
    queryFn: () => getStudents({ q: debouncedSearch }),
    enabled: debouncedSearch.length > 0
  })

  const { data: openCases, isLoading: loadingCases } = useQuery({
    queryKey: ['cases', 'open', 'my'],
    queryFn: () => getCases({ status: 'open', opened_by_id: user?.id })
  })

  const { data: myCasesToday } = useQuery({ queryKey: ['cases', 'my', 'today'], queryFn: () => getCases({ opened_by_id: user?.id, time: 'today' }) })
  const { data: myClosedToday } = useQuery({ queryKey: ['cases', 'closed', 'my', 'today'], queryFn: () => getCases({ status: 'closed', opened_by_id: user?.id, time: 'today' }) })
  
  return (
    <div className="space-y-6">
      <PageHeader title="Nurse Dashboard" description="Search students to open new cases or manage your open cases." />

      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium text-text-primary mb-2">Search student</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <Input 
            className="pl-10 h-12 text-lg" 
            placeholder="Type name or admission code..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {debouncedSearch.length > 0 && (
          <div className="mt-4 border border-border rounded-xl overflow-hidden divide-y divide-border">
            {searching ? (
              <div className="p-4 text-center text-text-muted">Searching...</div>
            ) : searchResults?.length > 0 ? (
              searchResults.map(student => (
                <div 
                  key={student.id} 
                  className="p-4 hover:bg-[#F0F5F2] cursor-pointer flex justify-between items-center transition-colors group"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div>
                    <div className="font-semibold text-text-primary group-hover:text-brand">{student.full_name}</div>
                    <div className="text-sm text-text-muted">{student.admission_code} · {student.grade} {student.class}</div>
                  </div>
                  <div className="text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    View profile &rarr;
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-text-muted">No students found for "{debouncedSearch}"</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="My open cases" value={openCases?.length || 0} color="amber" />
        <StatCard label="Cases I closed today" value={myClosedToday?.length || 0} color="green" />
        <StatCard label="Students seen today" value={myCasesToday?.length || 0} color="blue" />
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC]">
          <h3 className="font-semibold text-text-primary">My Open Cases Queue</h3>
        </div>
        <div className="flex-1 overflow-x-auto">
          {loadingCases ? (
            <LoadingRows rows={3} cols={4} />
          ) : !openCases?.length ? (
            <EmptyState icon={ClipboardList} title="No open cases" description="Your open cases will appear here." />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Opened</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {openCases.map(c => (
                  <tr key={c.id} className="hover:bg-[#F0F5F2] transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{c.student_full_name}</td>
                    <td className="px-4 py-3 text-text-muted">{c.grade}</td>
                    <td className="px-4 py-3 text-text-muted">{c.class}</td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>View case</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
