import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { getUsers } from '@/api/users.api'
import { getPendingLabTests } from '@/api/labTests.api'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { formatRelative } from '@/utils/formatDate'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'

export function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: casesToday, isLoading: load1 } = useQuery({ queryKey: ['cases', 'today'], queryFn: () => getCases({ time: 'today' }), staleTime: 30000 })
  const { data: openCases, isLoading: load2 } = useQuery({ queryKey: ['cases', 'open'], queryFn: () => getCases({ status: 'open' }), staleTime: 30000 })
  const { data: activeStaff, isLoading: load4 } = useQuery({ queryKey: ['users', 'active'], queryFn: () => getUsers({ is_active: true }), staleTime: 30000 })
  const { data: pendingLabs, isLoading: load5 } = useQuery({ queryKey: ['lab-tests', 'pending'], queryFn: getPendingLabTests, staleTime: 30000 })
  const { data: closedToday, isLoading: load6 } = useQuery({ queryKey: ['cases', 'closed', 'today'], queryFn: () => getCases({ status: 'closed', time: 'today' }), staleTime: 30000 })

  const { data: recentCases, isLoading: loadRecent, error: recentError } = useQuery({ queryKey: ['cases', 'recent'], queryFn: () => getCases({ limit: 10 }), staleTime: 30000 })

  const isLoadingStats = load1 || load2 || load4 || load5 || load6

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Overview of clinic operations today." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-xl" />)
        ) : (
          <>
            <StatCard label="Cases today" value={casesToday?.length || 0} color="blue" />
            <StatCard label="Open cases" value={openCases?.length || 0} color="amber" />
            <StatCard label="Active staff" value={activeStaff?.length || 0} color="green" />
            <StatCard label="Pending lab tests" value={pendingLabs?.length || 0} color="purple" />
            <StatCard label="Closed today" value={closedToday?.length || 0} color="green" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-[#FDFEFC]">
            <h3 className="font-semibold text-text-primary">Recent Cases</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            {loadRecent ? (
              <LoadingRows rows={5} cols={4} />
            ) : recentError ? (
              <EmptyState icon={AlertCircle} title="Couldn't load cases" description="Check your connection." />
            ) : !recentCases?.length ? (
              <EmptyState icon={ClipboardList} title="No cases" description="No recent cases found." />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Case ID</th>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Opened By</th>
                    <th className="px-4 py-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCases.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className="hover:bg-[#F0F5F2] cursor-pointer transition-colors group">
                      <td className="px-4 py-3 font-mono text-text-muted group-hover:text-brand">#{c.id}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {c.student_full_name}
                        <div className="text-xs text-text-muted font-normal md:hidden">{c.grade}</div>
                      </td>
                      <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-text-muted">{c.opened_by}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{formatRelative(c.created_at)}</td>
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
