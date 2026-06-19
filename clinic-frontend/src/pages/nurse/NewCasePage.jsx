import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents } from '@/api/students.api'
import { createCase } from '@/api/cases.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, X, AlertCircle, Thermometer, HeartPulse, Activity } from 'lucide-react'
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

  // Prevent background scrolling while modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Click outside to close (Optional, but usually good. Skipped for safety to not lose data) */}
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-800 leading-tight">Open New Case</h2>
            <p className="text-[13px] text-gray-500 mt-1">Record initial triage and open a case for a student.</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="new-case-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Student Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0052CC] text-[13px] font-bold">1</span>
                Select Student
              </div>
              
              {!selectedStudentId ? (
                <div className="ml-8 relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.student_id ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400`}
                      placeholder="Search by name or admission code..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {errors.student_id && <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.student_id.message}</p>}

                  {debouncedSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden z-10 max-h-60 overflow-y-auto">
                      {searching ? (
                        <div className="p-4 text-center text-gray-400 text-[13px] flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                        </div>
                      ) : students?.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {students.map(student => (
                            <div 
                              key={student.id} 
                              className="p-3 hover:bg-[#F8FAFC] cursor-pointer flex justify-between items-center transition-colors group"
                              onClick={() => {
                                setValue('student_id', student.id.toString(), { shouldValidate: true })
                                setSearchTerm('')
                              }}
                            >
                              <div>
                                <div className="font-medium text-gray-800 text-[14px]">{student.full_name}</div>
                                <div className="text-[12px] text-gray-500 mt-0.5">{student.admission_code} • {student.grade} {student.class}</div>
                              </div>
                              <button type="button" className="text-[13px] font-medium text-[#0052CC] opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-[13px]">No students found.</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-8 flex items-center justify-between p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
                  <div>
                    <div className="font-medium text-[#166534] text-[14px]">
                      Selected: {selectedStudent?.full_name || 'Student ID: ' + selectedStudentId}
                    </div>
                    <div className="text-[12px] text-[#15803D] mt-0.5">Opening case for this student</div>
                  </div>
                  <button 
                    type="button" 
                    className="text-[13px] font-medium text-[#166534] hover:text-[#14532D] underline underline-offset-2" 
                    onClick={() => setValue('student_id', '')}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 ml-8 my-6"></div>

            {/* Section 2: Triage Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0052CC] text-[13px] font-bold">2</span>
                Triage Details
              </div>
              
              <div className="ml-8 space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Chief Complaint <span className="text-red-500">*</span></label>
                  <Textarea 
                    {...register('complaint')} 
                    placeholder="What is the student's primary reason for visit?"
                    className={`min-h-[100px] text-[14px] resize-none ${errors.complaint ? "border-red-300 focus-visible:ring-red-100" : "border-gray-200"}`}
                  />
                  {errors.complaint && <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.complaint.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-gray-400" /> Temperature (°C)
                    </label>
                    <Input type="number" step="0.1" placeholder="36.5" className="h-10 text-[14px]" {...register('temperature', { valueAsNumber: false })} />
                    {errors.temperature && <p className="text-[12px] text-red-500 mt-1.5">{errors.temperature.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-gray-400" /> Blood Pressure
                    </label>
                    <Input placeholder="120/80" className="h-10 text-[14px]" {...register('blood_pressure')} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-gray-400" /> Heart Rate (bpm)
                    </label>
                    <Input type="number" placeholder="72" className="h-10 text-[14px]" {...register('heart_rate', { valueAsNumber: false })} />
                    {errors.heart_rate && <p className="text-[12px] text-red-500 mt-1.5">{errors.heart_rate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Respiratory Rate</label>
                    <Input type="number" placeholder="16" className="h-10 text-[14px]" {...register('respiratory_rate', { valueAsNumber: false })} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Severity Level</label>
                  <Controller
                    control={control}
                    name="severity"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-10 text-[14px]">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>Low (Routine)</div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Medium (Urgent)</div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>High (Emergency)</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-5 py-2 text-[14px] font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="new-case-form"
            disabled={isSubmitting || !selectedStudentId}
            className="px-6 py-2 text-[14px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] disabled:opacity-50 disabled:hover:bg-[#0052CC] rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Case
          </button>
        </div>
      </div>
    </div>
  )
}
