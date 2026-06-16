import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { login } from '@/api/auth.api'
import { useAuth } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
})

export function LoginPage() {
  const [globalError, setGlobalError] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setGlobalError('')
    try {
      const response = await login(data)
      auth.login(response.user, response.token)
      const redirects = {
        nurse: '/nurse/dashboard',
        doctor: '/doctor/dashboard',
        lab_technician: '/lab/dashboard',
        admin: '/admin/dashboard'
      }
      navigate(redirects[response.user.role] || '/')
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Failed to sign in. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">Clinic<span className="text-accent">Care</span></h1>
          <p className="text-text-muted mt-2">School Consultation Management</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email <span className="text-danger">*</span>
              </label>
              <Input
                type="email"
                {...register('email')}
                placeholder="name@school.edu"
                className={errors.email ? "border-danger" : ""}
              />
              {errors.email && <p className="text-sm text-danger mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password <span className="text-danger">*</span>
              </label>
              <Input
                type="password"
                {...register('password')}
                className={errors.password ? "border-danger" : ""}
              />
              {errors.password && <p className="text-sm text-danger mt-1">{errors.password.message}</p>}
            </div>

            {globalError && (
              <div className="p-3 bg-danger-bg border border-[#F5C2C2] text-danger rounded-md text-sm">
                {globalError}
              </div>
            )}

            <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
