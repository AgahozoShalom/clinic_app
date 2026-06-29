import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { getPendingLabTests } from '@/api/labTests.api'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Eye, TrendingUp, AlertCircle, Beaker } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function DoctorDashboard() {
  const navigate = useNavigate()

  // Fetch data
  const { data: openCases, isLoading: loadingCases } = useQuery({
    queryKey: ['cases', 'open'],
    queryFn: () => getCases({ status: 'open' })
  })

  const { data: pendingLabs } = useQuery({
    queryKey: ['lab-tests', 'pending'],
    queryFn: () => getPendingLabTests()
  })

  // Calculate Stats
  const totalOpenCases = openCases?.length || 0;
  const doctorQueue = openCases?.filter(c => c.needs_doctor || c.severity === 'high') || [];
  const pendingLabsCount = pendingLabs?.length || 0;

  const highSeverity = openCases?.filter(c => c.severity === 'high').length || 0;
  const mediumSeverity = openCases?.filter(c => c.severity === 'medium').length || 0;
  const lowSeverity = openCases?.filter(c => !c.severity || c.severity === 'low').length || 0;

  // Render dummy pie chart correctly if there's absolutely 0 cases
  const hasSeverityData = highSeverity > 0 || mediumSeverity > 0 || lowSeverity > 0;
  const severityData = [
    { name: 'High', value: highSeverity || (hasSeverityData ? 0 : 1), color: '#EF4444' }, // red-500
    { name: 'Medium', value: mediumSeverity || (hasSeverityData ? 0 : 1), color: '#F59E0B' }, // amber-500
    { name: 'Low', value: lowSeverity || (hasSeverityData ? 0 : 1), color: '#10B981' } // emerald-500
  ];

  // Lab Dependencies Data
  const labPending = openCases?.filter(c => c.lab_status === 'Pending').length || 0;
  const labCompleted = openCases?.filter(c => c.lab_status === 'Ready').length || 0;
  const noLabs = openCases?.filter(c => !c.lab_status || c.lab_status === 'N/A').length || 0;

  const hasLabData = labPending > 0 || labCompleted > 0 || noLabs > 0;
  const labData = [
    { name: 'Pending Labs', value: labPending || (hasLabData ? 0 : 1), color: '#A855F7' }, // purple-500
    { name: 'Labs Completed', value: labCompleted || (hasLabData ? 0 : 1), color: '#3B82F6' }, // blue-500
    { name: 'No Labs', value: noLabs || (hasLabData ? 0 : 1), color: '#14B8A6' } // teal-500
  ];

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">

      <div>
        <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Doctor Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of clinic operations, pending labs, and patients awaiting review.</p>
      </div>

      {/* Case Stats text boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-1">Total open cases</p>
          <p className="text-2xl font-normal text-gray-800">{totalOpenCases}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-orange-400 font-medium tracking-wide mb-1">Doctor review required</p>
          <p className="text-2xl font-normal text-gray-800">{doctorQueue.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
          <p className="text-[13px] text-purple-400 font-medium tracking-wide mb-1">Pending lab tests</p>
          <p className="text-2xl font-normal text-gray-800">{pendingLabsCount}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Severity Chart Card */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Case Severity Breakdown</h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke={hasSeverityData ? "none" : "#f3f4f6"}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={hasSeverityData ? entry.color : '#f9fafb'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                  <span className="text-sm font-medium text-gray-600">High</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{highSeverity}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                  <span className="text-sm font-medium text-gray-600">Medium</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{mediumSeverity}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                  <span className="text-sm font-medium text-gray-600">Low</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{lowSeverity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Dependencies Chart Card */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-medium text-gray-700">Lab Dependencies</h3>
            <Beaker className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center h-[160px]">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={labData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke={hasLabData ? "none" : "#f3f4f6"}
                  >
                    {labData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={hasLabData ? entry.color : '#f9fafb'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></div>
                  <span className="text-sm font-medium text-gray-600">Pending</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{labPending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
                  <span className="text-sm font-medium text-gray-600">Completed</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{labCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></div>
                  <span className="text-sm font-medium text-gray-600">No Labs</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{noLabs}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Cases Queue Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-gray-800">Cases Requiring Doctor Review</h3>
          <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {doctorQueue.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loadingCases ? (
            <div className="p-4"><LoadingRows rows={3} cols={5} /></div>
          ) : !doctorQueue.length ? (
            <div className="py-12"><EmptyState icon={ClipboardList} title="Queue is empty" description="No cases currently require doctor review." /></div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-normal">Student</th>
                  <th className="px-6 py-4 font-normal">Severity</th>
                  <th className="px-6 py-4 font-normal">Opened</th>
                  <th className="px-6 py-4 font-normal max-w-[200px]">Complaint</th>
                  <th className="px-6 py-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {doctorQueue.map(c => (
                  <tr key={c.case_id || c.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-gray-700 text-[13px] font-medium flex items-center gap-2">
                      {c.student_full_name}
                      {c.needs_doctor && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                          Escalated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.severity === 'high' ? (
                        <span className="text-red-500 font-medium flex items-center gap-1 text-[13px]">
                          <AlertCircle className="w-3.5 h-3.5" /> High
                        </span>
                      ) : c.severity === 'medium' ? (
                        <span className="text-orange-500 font-medium text-[13px]">Medium</span>
                      ) : (
                        <span className="text-gray-500 text-[13px]">Low</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">{formatRelative(c.created_at)}</td>
                    <td className="px-6 py-4 text-gray-500 text-[13px] max-w-[200px] truncate">{c.complaint}</td>
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
