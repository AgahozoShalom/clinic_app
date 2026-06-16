import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudents } from '@/api/students.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'

export function StudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students', { q: search }],
    queryFn: () => getStudents({ q: search })
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students Directory" 
        description="Search and view student medical histories." 
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC]">
          <Input 
            placeholder="Search by name or admission code..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <LoadingRows rows={10} cols={4} />
          ) : error ? (
            <EmptyState icon={Users} title="Couldn't load students" />
          ) : !students?.length ? (
            <EmptyState icon={Users} title="No students found" description="Try adjusting your search term." />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Admission Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Age/Gender</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-[#F0F5F2] transition-colors">
                    <td className="px-4 py-3 font-mono text-text-muted">{s.admission_code}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{s.full_name}</td>
                    <td className="px-4 py-3 text-text-muted">{s.grade} {s.class}</td>
                    <td className="px-4 py-3 text-text-muted">{s.age} yrs / {s.gender}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/students/${s.id}`)}>View History</Button>
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
