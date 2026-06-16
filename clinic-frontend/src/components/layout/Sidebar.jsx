import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserPlus, FileText, Beaker, LogOut } from 'lucide-react'
import { useAuth, useRole } from '@/hooks'
import { cn } from '@/utils'

export function Sidebar({ mobile, onClose }) {
  const { logout } = useAuth()
  const { role, isNurse, isDoctor, isLab, isAdmin } = useRole()

  const links = []

  if (isAdmin) {
    links.push({ to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' })
    links.push({ to: '/admin/staff', icon: Users, label: 'Staff' })
    links.push({ to: '/students', icon: UserPlus, label: 'Students' })
    links.push({ to: '/cases', icon: FileText, label: 'All Cases' })
  } else if (isNurse) {
    links.push({ to: '/nurse/dashboard', icon: LayoutDashboard, label: 'Dashboard' })
    links.push({ to: '/students', icon: Users, label: 'Students' })
    links.push({ to: '/cases', icon: FileText, label: 'Cases' })
  } else if (isDoctor) {
    links.push({ to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' })
    links.push({ to: '/students', icon: Users, label: 'Students' })
    links.push({ to: '/cases', icon: FileText, label: 'Cases' })
  } else if (isLab) {
    links.push({ to: '/lab/dashboard', icon: Beaker, label: 'Lab Queue' })
  }

  const roleLabels = {
    nurse: 'Nurse',
    doctor: 'Doctor',
    lab_technician: 'Lab Technician',
    admin: 'Administrator'
  }

  return (
    <div className="flex h-full flex-col bg-surface border-r border-border w-60">
      <div className="p-6 pb-2">
        <h2 className="text-xl font-bold text-brand">Clinic<span className="text-accent">Care</span></h2>
        <div className="mt-2 inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
          {roleLabels[role] || 'Staff'}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive 
                  ? "bg-brand-light text-brand font-medium relative overflow-hidden" 
                  : "text-text-muted hover:bg-[#F0F5F2] hover:text-text-primary"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" />}
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-[#F0F5F2] hover:text-text-primary transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
