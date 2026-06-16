import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deactivateUser } from '@/api/users.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Users, Loader2 } from 'lucide-react'
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
    <div className="space-y-6">
      <PageHeader 
        title="Staff Directory" 
        description="Manage clinic staff accounts and roles." 
        action={<Button onClick={() => openSheet()} className="bg-brand text-white hover:bg-brand-dark">Add staff</Button>}
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex-1 overflow-x-auto">
          {isLoading ? <LoadingRows rows={5} cols={5} /> : 
           error ? <EmptyState icon={Users} title="Error loading staff" /> :
           !staff?.length ? <EmptyState icon={Users} title="No staff found" /> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map(user => (
                  <tr key={user.id} className="hover:bg-[#F0F5F2] transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      <div>{user.email}</div>
                      <div className="text-xs">{user.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="text-success text-xs font-medium">Active</span>
                      ) : (
                        <span className="text-text-muted text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openSheet(user)}>Edit</Button>
                      {user.is_active && (
                        <Button variant="destructive" size="sm" onClick={() => setDeactivateDialog({ open: true, user })}>Deactivate</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
              <Input {...register('name')} className={errors.name ? "border-danger" : ""} />
              {errors.name && <p className="text-sm text-danger mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
              <Input type="email" {...register('email')} className={errors.email ? "border-danger" : ""} />
              {errors.email && <p className="text-sm text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Role *</label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.role ? "border-danger" : ""}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="lab_technician">Lab Technician</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-danger mt-1">{errors.role.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Phone *</label>
              <Input {...register('phone')} className={errors.phone ? "border-danger" : ""} />
              {errors.phone && <p className="text-sm text-danger mt-1">{errors.phone.message}</p>}
            </div>
            {!editingStaff && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Password *</label>
                <Input type="password" {...register('password')} className={errors.password ? "border-danger" : ""} />
                {errors.password && <p className="text-sm text-danger mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-brand hover:bg-brand-dark text-white" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStaff ? 'Save changes' : 'Add staff'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => !open && setDeactivateDialog({ open: false, user: null })}
        title="Deactivate Staff"
        description={`This will prevent ${deactivateDialog.user?.name} from signing in.`}
        confirmLabel="Deactivate"
        onConfirm={() => deactivateMutation.mutate(deactivateDialog.user?.id)}
        loading={deactivateMutation.isPending}
      />
    </div>
  )
}
