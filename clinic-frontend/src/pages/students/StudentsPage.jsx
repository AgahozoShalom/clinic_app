import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, uploadStudents } from '@/api/students.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Users, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function StudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students', { q: search, limit: 'all' }],
    queryFn: () => getStudents({ q: search, limit: 'all' })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students Directory"
        description="Search and view student medical histories."
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC] flex items-center justify-between gap-4">
          <Input
            placeholder="Search by name or admission code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div>
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
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="flex items-center gap-2">
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Excel
            </Button>
          </div>
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
