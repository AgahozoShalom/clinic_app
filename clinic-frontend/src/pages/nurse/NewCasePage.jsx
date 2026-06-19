import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents } from '@/api/students.api'
import { createCase } from '@/api/cases.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks'

const caseSchema = z.object({
  student_id: z.string().min(1, 'Please select a student'),
  complaint: z.string().min(5, 'Complaint must be at least 5 characters'),
  temperature: z.string().refine(val => val === '' || (Number(val) >= 30 && Number(val) <= 45), { message: "Must be between 30 and 45" }).optional(),
  blood_pressure: z.string().optional(),
  heart_rate: z.string().refine(val => val === '' || (Number(val) >= 30 && Number(val) <= 250), { message: "Must be between 30 and 250" }).optional(),
  respiratory_rate: z.string().refine(val => val === '' || (Number(val) >= 10 && Number(val) <= 60), { message: "Must be between 10 and 60" }).optional(),
  severity: z.enum(['low', 'medium', 'high'])
})

export function NewCasePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: students, isLoading: searching } = useQuery({
    queryKey: ['students', 'search', debouncedSearch],
    queryFn: () => getStudents({ q: debouncedSearch }),
    enabled: debouncedSearch.length > 0
  })

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: { student_id: '', complaint: '', temperature: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', severity: 'low' }
  })

  const selectedStudentId = watch('student_id')
  const selectedStudent = students?.find(s => s.id.toString() === selectedStudentId) || null

  const createMutation = useMutation({
    mutationFn: createCase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case created successfully')
      navigate(`/cases/${data.id}`)
    },
    onError: () => {
      toast.error('Failed to create case')
    }
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      temperature: data.temperature === '' ? undefined : Number(data.temperature),
      heart_rate: data.heart_rate === '' ? undefined : Number(data.heart_rate),
      respiratory_rate: data.respiratory_rate === '' ? undefined : Number(data.respiratory_rate),
      opened_by_id: user.id,
      student_id: Number(data.student_id)
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Open New Case" description="Record initial triage and open a case for a student." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">1. Select Student</h3>
            
            {!selectedStudentId ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <Input 
                    className="pl-10 h-10" 
                    placeholder="Search by name or ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {errors.student_id && <p className="text-sm text-danger mt-1">{errors.student_id.message}</p>}

                {debouncedSearch.length > 0 && (
                  <div className="mt-2 border border-border rounded-xl overflow-hidden divide-y divide-border max-h-60 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-center text-text-muted text-sm">Searching...</div>
                    ) : students?.length > 0 ? (
                      students.map(student => (
                        <div 
                          key={student.id} 
                          className="p-3 hover:bg-[#F0F5F2] cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            setValue('student_id', student.id.toString())
                            setSearchTerm('')
                          }}
                        >
                          <div>
                            <div className="font-medium text-text-primary">{student.full_name}</div>
                            <div className="text-xs text-text-muted">{student.admission_code} · {student.grade} {student.class}</div>
                          </div>
                          <Button size="sm" variant="outline">Select</Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-text-muted text-sm">No students found.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-brand-light/30 border border-brand-light rounded-lg">
                <div>
                  <div className="font-semibold text-brand">Selected: {selectedStudent?.full_name || 'Student ID: ' + selectedStudentId}</div>
                  <div className="text-sm text-text-muted">You are opening a case for this student.</div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue('student_id', '')}>
                  Change
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">2. Triage Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Chief Complaint *</label>
            <Textarea 
              {...register('complaint')} 
              placeholder="What is the student's primary reason for visit?"
              className={`min-h-[100px] ${errors.complaint ? "border-danger" : ""}`}
            />
            {errors.complaint && <p className="text-sm text-danger mt-1">{errors.complaint.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Temperature (°C)</label>
              <Input type="number" step="0.1" {...register('temperature', { valueAsNumber: false })} />
              {errors.temperature && <p className="text-sm text-danger mt-1">{errors.temperature.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Blood Pressure</label>
              <Input placeholder="e.g. 120/80" {...register('blood_pressure')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Heart Rate (bpm)</label>
              <Input type="number" {...register('heart_rate', { valueAsNumber: false })} />
              {errors.heart_rate && <p className="text-sm text-danger mt-1">{errors.heart_rate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Respiratory Rate</label>
              <Input type="number" {...register('respiratory_rate', { valueAsNumber: false })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Severity</label>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Routine)</SelectItem>
                    <SelectItem value="medium">Medium (Urgent)</SelectItem>
                    <SelectItem value="high">High (Emergency)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" className="bg-brand text-white hover:bg-brand-dark" disabled={isSubmitting || !selectedStudentId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open Case
          </Button>
        </div>
      </form>
    </div>
  )
}
