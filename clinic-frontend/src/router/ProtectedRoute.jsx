import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, useRole } from '@/hooks'

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated } = useAuth()
  const { role } = useRole()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their default dashboard based on role
    const redirects = {
      nurse: '/nurse/dashboard',
      doctor: '/doctor/dashboard',
      lab_technician: '/lab/dashboard',
      admin: '/admin/dashboard'
    }
    return <Navigate to={redirects[role] || '/login'} replace />
  }

  return <Outlet />
}
