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
import { AlertCircle, ClipboardList, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

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
    { name: 'Open Cases', value: openCases?.length || 0, color: '#E09C46' },
    { name: 'Closed Today', value: closedToday?.length || 0, color: '#4A8060' }
  ]

  const opsData = [
    { name: 'Active Staff', value: activeStaff?.length || 0, color: '#6D8662' },
    { name: 'Pending Labs', value: pendingLabs?.length || 0, color: '#2E5C40' }
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
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Cases Overview</h3>
            <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
          </div>

          {isLoadingStats ? (
             <div className="h-[160px] w-[160px] rounded-full border-8 border-gray-100 animate-pulse mx-auto"></div>
          ) : casesData.every(d => d.value === 0) ? (
             <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">No case data</div>
          ) : (
          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={casesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {casesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              {casesData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Ops Chart */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Operations Overview</h3>
            <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
          </div>

          {isLoadingStats ? (
             <div className="h-[160px] w-[160px] rounded-full border-8 border-gray-100 animate-pulse mx-auto"></div>
          ) : opsData.every(d => d.value === 0) ? (
             <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">No operations data</div>
          ) : (
          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {opsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              {opsData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{entry.value}</span>
                </div>
              ))}
            </div>
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
