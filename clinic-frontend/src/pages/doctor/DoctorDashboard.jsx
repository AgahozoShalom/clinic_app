import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, AlertCircle } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'

export function DoctorDashboard() {
  const navigate = useNavigate()

  const { data: openCases, isLoading: load1 } = useQuery({ queryKey: ['cases', 'open'], queryFn: () => getCases({ status: 'open' }) })
  const { data: severeCases, isLoading: load2 } = useQuery({ queryKey: ['cases', 'severe'], queryFn: () => getCases({ severity: 'high', status: 'open' }) })
  const { data: recentCases, isLoading: load3, error } = useQuery({ queryKey: ['cases', 'recent'], queryFn: () => getCases({ limit: 15, status: 'open' }) })

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Dashboard" description="Overview of patients waiting to be seen." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total open cases" value={openCases?.length || 0} color="blue" />
        <StatCard label="High severity" value={severeCases?.length || 0} color="red" />
        {/* other stats can be added here */}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC]">
          <h3 className="font-semibold text-text-primary">Waiting Queue</h3>
        </div>
        <div className="flex-1 overflow-x-auto">
          {load3 ? (
            <LoadingRows rows={5} cols={5} />
          ) : error ? (
            <EmptyState icon={AlertCircle} title="Couldn't load queue" />
          ) : !recentCases?.length ? (
            <EmptyState icon={ClipboardList} title="Queue is empty" description="No students are waiting to be seen." />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Wait Time</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Complaint</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCases.map(c => (
                  <tr key={c.case_id || c.id} className={`transition-colors ${c.needs_doctor ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#F0F5F2]'}`}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {c.student_full_name}
                      {c.needs_doctor && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-danger/10 text-danger border border-danger/20 uppercase">Escalated</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.severity === 'high' ? (
                        <span className="text-danger font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> High
                        </span>
                      ) : c.severity === 'medium' ? (
                        <span className="text-warning font-medium">Medium</span>
                      ) : (
                        <span className="text-text-muted">Low</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(c.created_at)}</td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell max-w-[200px] truncate">
                      {c.complaint}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${c.case_id || c.id}`)}>Review case</Button>
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
