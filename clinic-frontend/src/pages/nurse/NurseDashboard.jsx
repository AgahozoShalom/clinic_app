import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { getStudents } from '@/api/students.api'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Eye, TrendingUp } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'
import { useAuth } from '@/hooks'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function NurseDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch data
  const { data: students } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => getStudents({ limit: 'all' })
  })

  const { data: openCases, isLoading: loadingCases } = useQuery({
    queryKey: ['cases', 'open', 'my'],
    queryFn: () => getCases({ status: 'open', opened_by_id: user?.id })
  })

  const { data: myCasesToday } = useQuery({
    queryKey: ['cases', 'my', 'today'],
    queryFn: () => getCases({ opened_by_id: user?.id, time: 'today' })
  })

  const { data: myClosedToday } = useQuery({
    queryKey: ['cases', 'closed', 'my', 'today'],
    queryFn: () => getCases({ status: 'closed', opened_by_id: user?.id, time: 'today' })
  })

  // Calculate Stats
  const maleCount = students?.filter(s => s.gender?.toLowerCase() === 'male').length || 0;
  const femaleCount = students?.filter(s => s.gender?.toLowerCase() === 'female').length || 0;
  const totalStudents = students?.length || 0;

  // By default all students are boarding in this system as day count is 0 based on schema
  const boardingCount = totalStudents;
  const dayCount = 0;

  const genderData = [
    { name: 'Female', value: femaleCount || 1, color: '#22C55E' },
    { name: 'Male', value: maleCount || 1, color: '#1E40AF' }
  ];

  // Custom data for the half-circle gauge
  const boardingData = [
    { name: 'Boarding', value: boardingCount || 1, color: '#0052CC' },
    { name: 'Day', value: dayCount, color: '#E5E7EB' }
  ];

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">

      <div>
        <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Nurse Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your open cases and view student demographics.</p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gender Chart Card */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Gender</h3>
            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          </div>

          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1E40AF]"></div>
                  <span className="text-sm font-medium text-gray-600">Male</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{maleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
                  <span className="text-sm font-medium text-gray-600">Female</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{femaleCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boarding Chart Card */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Boarding</h3>
            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          </div>

          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative flex items-end pb-4">
              <ResponsiveContainer width="100%" height="200%">
                <PieChart>
                  <Pie
                    data={boardingData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {boardingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="text-sm font-medium text-gray-400">100 %</span>
              </div>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0052CC]"></div>
                  <span className="text-sm font-medium text-gray-600">Day</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{dayCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  <span className="text-sm font-medium text-gray-600">Boarding</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{boardingCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Case Stats text boxes from previous design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">All open cases</p>
          <p className="text-2xl font-normal text-gray-800">{openCases?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Cases I closed</p>
          <p className="text-2xl font-normal text-gray-800">{myClosedToday?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Students seen</p>
          <p className="text-2xl font-normal text-gray-800">{myCasesToday?.length || 0}</p>
        </div>
      </div>

      {/* Cases Queue Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-gray-800">My Open Cases Queue</h3>
          <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {openCases?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loadingCases ? (
            <div className="p-4"><LoadingRows rows={3} cols={4} /></div>
          ) : !openCases?.length ? (
            <div className="py-12"><EmptyState icon={ClipboardList} title="No open cases" description="Your open cases will appear here." /></div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-normal">Student</th>
                  <th className="px-6 py-4 font-normal">Grade</th>
                  <th className="px-6 py-4 font-normal">Class</th>
                  <th className="px-6 py-4 font-normal">Opened</th>
                  <th className="px-6 py-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {openCases.map(c => (
                  <tr key={c.case_id || c.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-gray-700 text-[13px] font-medium flex items-center gap-2">
                      {c.student_full_name}
                      {c.needs_doctor && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                          Escalated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">{c.grade}</td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">{c.class}</td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">{formatRelative(c.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/cases/${c.case_id || c.id}`)}
                          className="text-gray-700 hover:text-black transition-colors"
                          title="View Case"
                        >
                          <Eye className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
