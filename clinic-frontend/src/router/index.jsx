import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { StaffPage } from '@/pages/admin/StaffPage'
import { NurseDashboard } from '@/pages/nurse/NurseDashboard'
import { NewCasePage } from '@/pages/nurse/NewCasePage'
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard'
import { LabDashboard } from '@/pages/lab/LabDashboard'
import { CasesPage } from '@/pages/cases/CasesPage'
import { CaseDetail } from '@/pages/cases/CaseDetail'
import { StudentsPage } from '@/pages/students/StudentsPage'
import { StudentDetail } from '@/pages/students/StudentDetail'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Validates token
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          // Base redirect
          {
            index: true,
            element: <Navigate to="/login" replace />
          },
          // Admin Routes
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [
              { path: 'admin/dashboard', element: <AdminDashboard /> },
              { path: 'admin/staff', element: <StaffPage /> }
            ]
          },
          // Nurse Routes
          {
            element: <ProtectedRoute allowedRoles={['nurse']} />,
            children: [
              { path: 'nurse/dashboard', element: <NurseDashboard /> },
              { path: 'nurse/cases/new', element: <NewCasePage /> }
            ]
          },
          // Doctor Routes
          {
            element: <ProtectedRoute allowedRoles={['doctor']} />,
            children: [
              { path: 'doctor/dashboard', element: <DoctorDashboard /> }
            ]
          },
          // Lab Routes
          {
            element: <ProtectedRoute allowedRoles={['lab_technician']} />,
            children: [
              { path: 'lab/dashboard', element: <LabDashboard /> }
            ]
          },
          // Shared Cases Routes
          {
            path: 'cases',
            element: <ProtectedRoute allowedRoles={['nurse', 'doctor']} />,
            children: [
              { index: true, element: <CasesPage /> }
            ]
          },
          {
            path: 'cases/:id',
            element: <ProtectedRoute allowedRoles={['nurse', 'doctor', 'admin', 'lab_technician']} />,
            children: [
              { index: true, element: <CaseDetail /> }
            ]
          },
          // Shared Students Routes
          {
            element: <ProtectedRoute allowedRoles={['nurse', 'doctor', 'admin']} />,
            children: [
              { path: 'students', element: <StudentsPage /> },
              { path: 'students/:id', element: <StudentDetail /> }
            ]
          },
          // Fallback
          {
            path: '*',
            element: <Navigate to="/login" replace />
          }
        ]
      }
    ]
  }
])
