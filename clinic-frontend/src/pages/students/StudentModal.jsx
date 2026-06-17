import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStudent, updateStudent } from '@/api/students.api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function StudentModal({ isOpen, onClose, student }) {
  const queryClient = useQueryClient()
  const isEditing = !!student

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      admission_code: '',
      first_name: '',
      last_name: '',
      grade: '',
      class: '',
      gender: '',
      dob: ''
    }
  })

  useEffect(() => {
    if (student) {
      reset({
        admission_code: student.admission_code || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        grade: student.grade || '',
        class: student.class || '',
        gender: student.gender || '',
        dob: student.dob ? student.dob.split('T')[0] : ''
      })
    } else {
      reset({
        admission_code: '',
        first_name: '',
        last_name: '',
        grade: '',
        class: '',
        gender: '',
        dob: ''
      })
    }
  }, [student, reset])

  const mutation = useMutation({
    mutationFn: isEditing ? updateStudent : createStudent,
    onSuccess: () => {
      toast.success(`Student ${isEditing ? 'updated' : 'added'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['students'] })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} student`)
    }
  })

  const onSubmit = (data) => {
    if (isEditing) {
      mutation.mutate({ id: student.id, ...data })
    } else {
      mutation.mutate(data)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add Student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admission Code</label>
              <Input {...register('admission_code', { required: 'Required' })} />
              {errors.admission_code && <span className="text-xs text-red-500">{errors.admission_code.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input {...register('first_name', { required: 'Required' })} />
              {errors.first_name && <span className="text-xs text-red-500">{errors.first_name.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input {...register('last_name', { required: 'Required' })} />
              {errors.last_name && <span className="text-xs text-red-500">{errors.last_name.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select {...register('gender', { required: 'Required' })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <span className="text-xs text-red-500">{errors.gender.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input type="date" {...register('dob')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Input {...register('grade')} placeholder="e.g. S1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Input {...register('class')} placeholder="e.g. A" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
