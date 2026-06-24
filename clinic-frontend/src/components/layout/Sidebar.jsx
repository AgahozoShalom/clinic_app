import React from 'react'
import { Settings, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Logo from '@/assets/Logo.svg'

// Helper to generate calendar days for the current month
function getCalendarDays() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday
  
  const days = []
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, isToday: i === today.getDate() })
  }
  
  // Next month padding
  const remainingCells = 42 - days.length // 6 rows of 7
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false })
  }
  
  return {
    monthName: firstDay.toLocaleString('default', { month: 'long' }),
    year,
    days
  }
}

export function Sidebar({ mobile, onClose }) {
  const calendar = getCalendarDays()
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-100 w-[260px] font-sans shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-50">
      
      {/* Brand Logo Box */}
      <div className="p-4">
        <div className="bg-[#F8F9FA] rounded-xl p-4 flex items-center gap-3 border border-gray-100/50">
          <img src={Logo} alt="Clinic Logo" className="w-10 h-10 shrink-0 object-contain" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-widest text-gray-800 leading-tight">
              AGAHOZO<br/>SHALOM<br/>YOUTH VILLAGE
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 font-medium">CLINIC APP</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar"></div>

      {/* Mini Calendar */}
      <div className="px-5 py-4 border-t border-gray-100/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-gray-800 uppercase tracking-wide">
            {calendar.monthName} {calendar.year}
          </h3>
          <div className="flex items-center gap-0.5 text-gray-400">
            <button className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-2 mb-2 text-center">
          {weekDays.map(day => (
            <div key={day} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {calendar.days.map((d, i) => (
            <div 
              key={i} 
              className={`text-[12px] flex items-center justify-center w-6 h-6 mx-auto rounded-full transition-colors
                ${d.isCurrentMonth ? 'text-gray-700 font-medium' : 'text-gray-300 font-normal'}
                ${d.isToday ? 'bg-[#0052CC] text-white font-semibold shadow-sm' : 'hover:bg-gray-100 cursor-pointer'}
              `}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="p-4 border-t border-gray-100/50">
        <button className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-[15px] h-[15px] text-gray-400" />
            <span>Light Theme</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

    </div>
  )
}
