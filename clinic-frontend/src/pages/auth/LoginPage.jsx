import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { login } from '@/api/auth.api'
import { useAuth } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Logo from '@/assets/Logo.svg'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
})

export function LoginPage() {
  const [globalError, setGlobalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-surface p-4 overflow-hidden z-0">
      {/* Top Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10 pointer-events-none flex justify-center">
        <div className="w-full max-w-[1200px] h-full relative">
          <div className="absolute -top-[300px] left-0 w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-80"></div>
          <div className="absolute -top-[300px] right-0 w-[600px] h-[600px] bg-brand/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-80"></div>
        </div>
      </div>

      <div className="w-full max-w-[360px]">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={Logo} alt="Clinic Logo" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-text-primary">Sign in</h2>
          <p className="text-text-muted mt-2 text-sm">School Consultation Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="sr-only">Email</label>
            <Input
              type="email"
              {...register('email')}
              placeholder="Email *"
              className={`h-11 bg-transparent ${errors.email ? "border-danger" : "border-border"}`}
            />
            {errors.email && <p className="text-sm text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="sr-only">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                {...register('password')}
                placeholder="Password *"
                className={`h-11 bg-transparent pr-10 ${errors.password ? "border-danger" : "border-border"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-sm text-danger mt-1">{errors.password.message}</p>}
          </div>

          {globalError && (
            <div className="p-3 bg-danger-bg border border-[#F5C2C2] text-danger rounded-md text-sm">
              {globalError}
            </div>
          )}

          <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-medium mt-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
