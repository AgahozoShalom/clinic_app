import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingLabTests, updateLabTestResults, getCompletedLabTests } from '@/api/labTests.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { Beaker, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'
import { toast } from 'sonner'

export function LabDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('pending')

  const { data: pendingTests, isLoading: isLoadingPending, error: errorPending } = useQuery({
    queryKey: ['lab-tests', 'pending'],
    queryFn: getPendingLabTests
  })

  const { data: completedTests, isLoading: isLoadingCompleted, error: errorCompleted } = useQuery({
    queryKey: ['lab-tests', 'completed'],
    queryFn: getCompletedLabTests
  })

  const [resultDialog, setResultDialog] = useState({ open: false, test: null })
  const [resultsText, setResultsText] = useState('')

  const updateMutation = useMutation({
    mutationFn: updateLabTestResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['lab-tests', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Test results submitted successfully')
      setResultDialog({ open: false, test: null })
      setResultsText('')
    },
    onError: () => toast.error('Failed to submit results')
  })

  const submitResults = () => {
    if (!resultsText.trim()) {
      toast.error('Please enter results')
      return
    }
    updateMutation.mutate({
      id: resultDialog.test.test_id,
      status: 'completed',
      results: resultsText
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Technician Dashboard" description="Manage incoming lab test requests and input results." />

      <div className="flex gap-6 border-b border-border">
        <button 
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Tests
        </button>
        <button 
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'completed' ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Tests
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-[#FDFEFC]">
            <h3 className="font-semibold text-text-primary">Pending Lab Tests</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            {isLoadingPending ? (
              <LoadingRows rows={5} cols={4} />
            ) : errorPending ? (
              <EmptyState icon={Beaker} title="Couldn't load queue" />
            ) : !pendingTests?.length ? (
              <EmptyState icon={CheckCircle2} title="All caught up!" description="No pending lab tests." />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Test Name</th>
                    <th className="px-4 py-3 font-medium">Requested For</th>
                    <th className="px-4 py-3 font-medium">Time Requested</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingTests.map(test => (
                    <tr key={test.test_id} className={`transition-colors ${test.severity === 'severe' ? 'bg-danger-bg/30 hover:bg-danger-bg/50' : 'hover:bg-[#F0F5F2]'}`}>
                      <td className="px-4 py-3 font-medium text-text-primary">{test.test_name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        <div className="font-medium text-text-primary">{test.student_name}</div>
                        <div className="text-xs">{test.admission_code}</div>
                        <div className="text-xs mt-1">
                          Case #{test.case_id}
                          <Button variant="link" size="sm" className="ml-1 h-auto p-0" onClick={() => navigate(`/cases/${test.case_id}`)}>View</Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatRelative(test.requested_at)}
                        {test.severity === 'severe' && (
                          <div className="mt-1 flex items-center gap-1 text-danger text-xs font-semibold bg-white w-max px-2 py-0.5 rounded border border-danger/20 shadow-sm">
                            <AlertCircle className="w-3 h-3" /> Priority
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          className="bg-brand text-white hover:bg-brand-dark"
                          onClick={() => {
                            setResultDialog({ open: true, test })
                            setResultsText('')
                          }}
                        >
                          Enter Results
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-[#FDFEFC]">
            <h3 className="font-semibold text-text-primary">Recently Completed</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            {isLoadingCompleted ? (
              <LoadingRows rows={5} cols={4} />
            ) : errorCompleted ? (
              <EmptyState icon={FileText} title="Couldn't load history" />
            ) : !completedTests?.length ? (
              <EmptyState icon={FileText} title="No history found" description="You haven't completed any lab tests yet." />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted bg-[#F5F7F5] border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Test Name</th>
                    <th className="px-4 py-3 font-medium">Requested For</th>
                    <th className="px-4 py-3 font-medium w-1/3">Results</th>
                    <th className="px-4 py-3 font-medium">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {completedTests.map(test => (
                    <tr key={test.test_id} className="hover:bg-[#F0F5F2] transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">{test.test_name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        <div className="font-medium text-text-primary">{test.student_name}</div>
                        <div className="text-xs">{test.admission_code}</div>
                        <div className="text-xs mt-1">
                          Case #{test.case_id}
                          <Button variant="link" size="sm" className="ml-1 h-auto p-0" onClick={() => navigate(`/cases/${test.case_id}`)}>View</Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <div className="line-clamp-2 text-sm bg-gray-50 p-2 rounded border border-border">
                          {test.results}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{formatRelative(test.fulfilled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Dialog open={resultDialog.open} onOpenChange={(open) => !open && setResultDialog({ open: false, test: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Lab Results</DialogTitle>
            <DialogDescription>
              Test: {resultDialog.test?.test_name} <br/>
              Student: {resultDialog.test?.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-primary mb-1">Results</label>
            <Textarea 
              value={resultsText} 
              onChange={(e) => setResultsText(e.target.value)} 
              placeholder="Enter the lab test findings here..."
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setResultDialog({ open: false, test: null })}>Cancel</Button>
            <Button 
              className="bg-brand text-white hover:bg-brand-dark" 
              onClick={submitResults}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
