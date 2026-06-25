import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth, useRole } from '@/hooks'
import { Menu, Search, Bell, MessageSquare, LogOut, Home, Users, FolderOpen, Beaker } from 'lucide-react'
import { cn } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { role, isNurse, isDoctor, isLab, isAdmin } = useRole()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JM'
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const { data: openCases } = useQuery({
    queryKey: ['cases', { status: 'open' }],
    queryFn: () => getCases({ status: 'open' }),
    enabled: isAdmin || isNurse || isDoctor
  })
  
  const openCasesCount = openCases?.length || 0

  const links = []

  if (isAdmin) {
    links.push({ to: '/admin/dashboard', icon: Home, label: 'Home', color: 'text-purple-500' })
    links.push({ to: '/students', icon: Users, label: 'Students', color: 'text-blue-500' })
    links.push({ to: '/admin/staff', icon: Users, label: 'Staff', color: 'text-gray-500' })
  } else if (isNurse) {
    links.push({ to: '/nurse/dashboard', icon: Home, label: 'Home', color: 'text-purple-500' })
    links.push({ to: '/students', icon: Users, label: 'Students', color: 'text-blue-500' })
    links.push({ to: '/cases', icon: FolderOpen, label: 'Cases', badge: openCasesCount, color: 'text-red-500' })
  } else if (isDoctor) {
    links.push({ to: '/doctor/dashboard', icon: Home, label: 'Home', color: 'text-purple-500' })
    links.push({ to: '/students', icon: Users, label: 'Students', color: 'text-blue-500' })
    links.push({ to: '/cases', icon: FolderOpen, label: 'Cases', badge: openCasesCount, color: 'text-red-500' })
  } else if (isLab) {
    links.push({ to: '/lab/dashboard', icon: Beaker, label: 'Lab Queue', color: 'text-blue-500' })
  } else {
    // Fallback
    links.push({ to: '/', icon: Home, label: 'Home', color: 'text-purple-500' })
  }

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] font-sans relative z-40">
      
      {/* Left side: Navigation */}
      <div className="flex items-center h-full">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-900 mr-4"
        >
          <Menu className="h-6 w-6" />
        </button>

        <nav className="hidden lg:flex items-center h-full space-x-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center h-full px-2 relative min-w-[60px] transition-colors",
                isActive 
                  ? "text-[#0052CC]" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex flex-col items-center gap-1.5 mt-1">
                    <link.icon className={cn("w-[22px] h-[22px]", isActive ? link.color : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={cn("text-[11px] font-medium tracking-wide", isActive ? "text-gray-800" : "text-gray-400")}>
                      {link.label}
                    </span>
                    
                    {/* Badge */}
                    {link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-3 bg-[#FF4747] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm leading-none">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0052CC] rounded-t-md" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-5">
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
          <Search className="w-[18px] h-[18px]" />
        </button>
        
        <button className="hidden sm:flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm">
          <Bell className="w-4 h-4" />
          Enable notifications
        </button>
        
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <MessageSquare className="w-4 h-4" />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0052CC] text-sm font-medium text-white shadow-sm ring-2 ring-white cursor-pointer ml-1 hover:bg-[#0047B3] transition-colors"
          >
            {initials}
          </div>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-3 border-b border-gray-100/80 mb-1.5">
                <p className="text-[14px] font-medium text-gray-800 leading-none">{user?.name || 'User'}</p>
                <p className="text-[12px] text-gray-500 mt-1.5 capitalize font-medium">{role?.replace('_', ' ')}</p>
              </div>
              <div className="px-2 pb-1">
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-[15px] h-[15px]" />
                    <span className="font-medium">Logout</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
