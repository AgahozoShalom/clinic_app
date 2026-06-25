import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deactivateUser, deleteUser } from '@/api/users.api'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Users, Loader2, Plus, Edit, UserX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

const staffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['nurse', 'doctor', 'lab_technician', 'admin']),
  phone: z.string().min(5, 'Phone is required'),
  password: z.string().optional()
})

export function StaffPage() {
  const queryClient = useQueryClient()
  const { data: staff, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: () => getUsers() })
  
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, user: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', role: 'nurse', phone: '', password: '' }
  })

  const openSheet = (user = null) => {
    setEditingStaff(user)
    if (user) {
      reset({ name: user.name, email: user.email, role: user.role, phone: user.phone, password: '' })
    } else {
      reset({ name: '', email: '', role: 'nurse', phone: '', password: '' })
    }
    setSheetOpen(true)
  }

  const createMutation = useMutation({ mutationFn: createUser, onSuccess: () => onSaveSuccess('Staff created') })
  const updateMutation = useMutation({ mutationFn: updateUser, onSuccess: () => onSaveSuccess('Staff updated') })
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Staff deactivated successfully')
      setDeactivateDialog({ open: false, user: null })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Staff deleted successfully')
      setDeleteDialog({ open: false, user: null })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete staff')
    }
  })

  const onSaveSuccess = (msg) => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    toast.success(msg)
    setSheetOpen(false)
  }

  const onSubmit = (data) => {
    if (editingStaff) {
      const payload = { id: editingStaff.id, ...data }
      delete payload.password
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Staff Directory</h1>
          <p className="text-gray-500 mt-2">Manage clinic staff accounts and roles.</p>
        </div>
        <button 
          onClick={() => openSheet()}
          className="flex items-center justify-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-medium text-gray-800">Staff Members</h2>
            <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {staff?.length || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
          <div className="flex-1 overflow-x-auto">
            {isLoading ? <div className="p-4"><LoadingRows rows={5} cols={5} /></div> : 
            error ? <div className="py-12"><EmptyState icon={Users} title="Error loading staff" /></div> :
            !staff?.length ? <div className="py-12"><EmptyState icon={Users} title="No staff found" /></div> : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-normal">Name</th>
                    <th className="px-6 py-4 font-normal">Role</th>
                    <th className="px-6 py-4 font-normal">Contact</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {staff.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-700 text-[13px] font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-[13px]">
                        <span className="inline-flex items-center rounded-full bg-[#E5F0FF] px-2.5 py-0.5 text-xs font-medium text-[#0052CC]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">
                        <div className="font-medium text-gray-700">{user.email}</div>
                        <div className="text-[12px] mt-0.5">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-[13px]">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openSheet(user)}
                            className="text-gray-500 hover:text-[#0052CC] transition-colors flex items-center gap-1.5"
                            title="Edit Staff"
                          >
                            <Edit className="w-[16px] h-[16px]" />
                          </button>
                          {user.is_active && (
                            <button 
                              onClick={() => setDeactivateDialog({ open: true, user })}
                              className="text-gray-500 hover:text-amber-600 transition-colors flex items-center gap-1.5"
                              title="Deactivate Staff"
                            >
                              <UserX className="w-[16px] h-[16px]" />
                            </button>
                          )}
                          <button 
                            onClick={() => setDeleteDialog({ open: true, user })}
                            className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-[16px] h-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100/80 bg-[#FDFEFC]">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium text-gray-800 tracking-tight">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-500 mt-1">
                {editingStaff ? 'Update the details for this staff member below.' : 'Fill in the details below to create a new staff account.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="e.g. Jane Doe"
                  {...register('name')} 
                  className={`text-[13px] h-10 shadow-sm border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                />
                {errors.name && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name.message}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <Input 
                  type="email" 
                  placeholder="name@clinic.com"
                  {...register('email')} 
                  className={`text-[13px] h-10 shadow-sm border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                />
                {errors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="+250..."
                  {...register('phone')} 
                  className={`text-[13px] h-10 shadow-sm border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.phone.message}</p>}
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={`text-[13px] h-10 shadow-sm border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 ${errors.role ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-lg border-gray-100">
                        <SelectItem className="text-[13px] cursor-pointer" value="nurse">Nurse</SelectItem>
                        <SelectItem className="text-[13px] cursor-pointer" value="doctor">Doctor</SelectItem>
                        <SelectItem className="text-[13px] cursor-pointer" value="lab_technician">Lab Technician</SelectItem>
                        <SelectItem className="text-[13px] cursor-pointer" value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.role.message}</p>}
              </div>

              {!editingStaff && (
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Initial Password <span className="text-red-500">*</span></label>
                  <Input 
                    type="password" 
                    placeholder="Create a secure password"
                    {...register('password')} 
                    className={`text-[13px] h-10 shadow-sm border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password.message}</p>}
                  <p className="text-[11px] text-gray-500 mt-1.5">Staff will use this to log in for the first time.</p>
                </div>
              )}
            </div>
            
            <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setSheetOpen(false)}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white px-5 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingStaff ? (
                  'Save Changes'
                ) : (
                  'Create Staff Account'
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => !open && setDeactivateDialog({ open: false, user: null })}
        title="Deactivate Staff"
        description={`This will prevent ${deactivateDialog.user?.name} from signing in.`}
        confirmLabel="Deactivate"
        onConfirm={() => deactivateMutation.mutate(deactivateDialog.user?.id)}
        loading={deactivateMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}
        title="Delete Staff"
        description={`Are you sure you want to completely delete ${deleteDialog.user?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate(deleteDialog.user?.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
