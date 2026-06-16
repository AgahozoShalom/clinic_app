import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingLabTests, updateLabTestResults } from '@/api/labTests.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { Beaker, Loader2 } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'
import { toast } from 'sonner'

export function LabDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: pendingTests, isLoading, error } = useQuery({
    queryKey: ['lab-tests', 'pending'],
    queryFn: getPendingLabTests
  })

  const [resultDialog, setResultDialog] = useState({ open: false, test: null })
  const [resultsText, setResultsText] = useState('')

  const updateMutation = useMutation({
    mutationFn: updateLabTestResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests', 'pending'] })
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
      id: resultDialog.test.id,
      status: 'completed',
      results: resultsText
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Technician Dashboard" description="Manage incoming lab test requests and input results." />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-[#FDFEFC]">
          <h3 className="font-semibold text-text-primary">Pending Lab Tests</h3>
        </div>
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <LoadingRows rows={5} cols={4} />
          ) : error ? (
            <EmptyState icon={Beaker} title="Couldn't load queue" />
          ) : !pendingTests?.length ? (
            <EmptyState icon={Beaker} title="Queue is empty" description="No pending lab tests." />
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
                  <tr key={test.id} className="hover:bg-[#F0F5F2] transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{test.test_name}</td>
                    <td className="px-4 py-3 text-text-muted">
                      Case #{test.case_id}
                      <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => navigate(`/cases/${test.case_id}`)}>View Case</Button>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(test.created_at)}</td>
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

      <Dialog open={resultDialog.open} onOpenChange={(open) => !open && setResultDialog({ open: false, test: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Lab Results</DialogTitle>
            <DialogDescription>
              Test: {resultDialog.test?.test_name}
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
