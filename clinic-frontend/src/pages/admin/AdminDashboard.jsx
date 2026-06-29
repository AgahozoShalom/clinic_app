import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/api/users.api'
import { getPendingLabTests } from '@/api/labTests.api'
import { getCases } from '@/api/cases.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNavigate } from 'react-router-dom'
import { formatRelative } from '@/utils/formatDate'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export function AdminDashboard() {
  const navigate = useNavigate()
  
  const { data: casesToday, isLoading: load1 } = useQuery({ queryKey: ['cases', 'today'], queryFn: () => getCases({ time: 'today' }), staleTime: 30000 })
  const { data: openCases, isLoading: load2 } = useQuery({ queryKey: ['cases', 'open'], queryFn: () => getCases({ status: 'open' }), staleTime: 30000 })
  const { data: closedToday, isLoading: load6 } = useQuery({ queryKey: ['cases', 'closed', 'today'], queryFn: () => getCases({ status: 'closed', time: 'today' }), staleTime: 30000 })
  const { data: activeStaff, isLoading: load4 } = useQuery({ queryKey: ['users', 'active'], queryFn: () => getUsers({ is_active: true }), staleTime: 30000 })
  const { data: pendingLabs, isLoading: load5 } = useQuery({ queryKey: ['lab-tests', 'pending'], queryFn: getPendingLabTests, staleTime: 30000 })
  
  const { data: recentCases, isLoading: loadRecent, error: recentError } = useQuery({ queryKey: ['cases', 'recent'], queryFn: () => getCases({ limit: 10 }), staleTime: 30000 })

  const isLoadingStats = load1 || load2 || load4 || load5 || load6

  const casesData = [
    { name: 'Open Cases', value: openCases?.length || 0, color: '#f59e0b' },
    { name: 'Closed Today', value: closedToday?.length || 0, color: '#10b981' }
  ]

  const opsData = [
    { name: 'Active Staff', value: activeStaff?.length || 0, color: '#3b82f6' },
    { name: 'Pending Labs', value: pendingLabs?.length || 0, color: '#8b5cf6' }
  ]

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of clinic operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cases Chart */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 p-6 flex flex-col items-center">
          <h3 className="text-[15px] font-medium text-gray-800 self-start mb-4">Cases Overview</h3>
          {isLoadingStats ? (
            <div className="h-[200px] w-[200px] rounded-full border-8 border-gray-100 animate-pulse"></div>
          ) : casesData.every(d => d.value === 0) ? (
             <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No case data</div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={casesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {casesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Cases']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Ops Chart */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 p-6 flex flex-col items-center">
          <h3 className="text-[15px] font-medium text-gray-800 self-start mb-4">Operations Overview</h3>
          {isLoadingStats ? (
            <div className="h-[200px] w-[200px] rounded-full border-8 border-gray-100 animate-pulse"></div>
          ) : opsData.every(d => d.value === 0) ? (
             <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No operations data</div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {opsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Total']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100/80">
            <h2 className="text-[15px] font-medium text-gray-800">Recent Cases</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            {loadRecent ? (
              <div className="p-4"><LoadingRows rows={5} cols={5} /></div>
            ) : recentError ? (
              <div className="py-12"><EmptyState icon={AlertCircle} title="Couldn't load cases" description="Check your connection." /></div>
            ) : !recentCases?.length ? (
              <div className="py-12"><EmptyState icon={ClipboardList} title="No cases" description="No recent cases found." /></div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-normal">Case ID</th>
                    <th className="px-6 py-4 font-normal">Student</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal hidden md:table-cell">Opened By</th>
                    <th className="px-6 py-4 font-normal text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {recentCases.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className="hover:bg-gray-50/50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 text-gray-500 font-mono text-[13px] group-hover:text-[#0052CC]">#{c.id}</td>
                      <td className="px-6 py-4 text-gray-700 text-[13px] font-medium">
                        {c.student_full_name}
                      </td>
                      <td className="px-6 py-4 text-[13px]"><StatusPill status={c.status} /></td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-500 text-[13px]">{c.opened_by}</td>
                      <td className="px-6 py-4 text-right text-gray-500 text-[13px]">{formatRelative(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
