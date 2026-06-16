import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@/api/cases.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Filter } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'

export function CasesPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: cases, isLoading, error } = useQuery({
    queryKey: ['cases', { status: statusFilter === 'all' ? undefined : statusFilter, q: search }],
    queryFn: () => getCases({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      q: search 
    })
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="All Cases" 
        description="View and manage all student clinic cases." 
        action={<Button onClick={() => navigate('/nurse/cases/new')} className="bg-brand text-white hover:bg-brand-dark">New Case</Button>}
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <Input 
              placeholder="Search student..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending_transfer">Pending Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <LoadingRows rows={10} cols={5} />
          ) : error ? (
            <EmptyState icon={ClipboardList} title="Couldn't load cases" />
          ) : !cases?.length ? (
            <EmptyState icon={ClipboardList} title="No cases found" description="Try adjusting your filters." />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Case ID</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date Opened</th>
                  <th className="px-4 py-3 font-medium">Opened By</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-[#F0F5F2] transition-colors">
                    <td className="px-4 py-3 font-mono text-text-muted">#{c.id}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{c.student_full_name}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(c.created_at)}</td>
                    <td className="px-4 py-3 text-text-muted">{c.opened_by}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>View</Button>
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
