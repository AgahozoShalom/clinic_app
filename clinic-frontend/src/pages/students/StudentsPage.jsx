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
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { deleteStudent, deleteAllStudents } from '@/api/students.api'
import { Edit, Trash2, Plus } from 'lucide-react'
import { StudentModal } from './StudentModal'

export function StudentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students', { q: debouncedSearch, limit: 'all' }],
    queryFn: () => getStudents({ q: debouncedSearch, limit: 'all' })
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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => { setEditingStudent(null); setIsModalOpen(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            )}
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
            {isAdmin && (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="flex items-center gap-2">
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Excel
              </Button>
            )}
            {isAdmin && (
              <Button variant="destructive" onClick={handleDeleteAll} disabled={deleteAllMutation.isPending} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            )}
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
                    <td className="px-4 py-3 text-text-muted">{s.age !== null ? `${s.age} yrs` : 'N/A'} / {s.gender}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/students/${s.id}`)}>View History</Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingStudent(s); setIsModalOpen(true); }}>
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} disabled={deleteMutation.isPending}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
      </div>
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={editingStudent}
      />
    </div>
  )
}
