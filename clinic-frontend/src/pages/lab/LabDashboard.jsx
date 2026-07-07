import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingLabTests, updateLabTestResults, getCompletedLabTests } from '@/api/labTests.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingRows } from '@/components/shared/LoadingRows'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { Beaker, Loader2, AlertCircle, FileText, CheckCircle2, Eye } from 'lucide-react'
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

  const [resultDialog, setResultDialog] = useState({ open: false, caseGroup: null })
  const [resultsData, setResultsData] = useState({})

  const groupedPendingTests = useMemo(() => {
    if (!pendingTests) return []
    const map = new Map()
    pendingTests.forEach(test => {
      if (!map.has(test.case_id)) {
        map.set(test.case_id, {
          case_id: test.case_id,
          student_name: test.student_name,
          admission_code: test.admission_code,
          requested_at: test.requested_at,
          severity: test.severity,
          tests: []
        })
      }
      map.get(test.case_id).tests.push(test)
      if (test.severity === 'severe') {
        map.get(test.case_id).severity = 'severe'
      }
    })
    return Array.from(map.values())
  }, [pendingTests])

  const updateMutation = useMutation({
    mutationFn: updateLabTestResults
  })

  const submitResults = async () => {
    const testsToSubmit = Object.entries(resultsData).filter(([_, result]) => result.trim() !== '')
    if (testsToSubmit.length === 0) {
      toast.error('Please enter results for at least one test')
      return
    }

    try {
      await Promise.all(
        testsToSubmit.map(([id, results]) => 
          updateMutation.mutateAsync({ id, status: 'completed', results })
        )
      )
      queryClient.invalidateQueries({ queryKey: ['lab-tests', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['lab-tests', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Test results submitted successfully')
      setResultDialog({ open: false, caseGroup: null })
      setResultsData({})
    } catch (e) {
      toast.error('Failed to submit some results')
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans">
      <div>
        <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Lab Technician Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage incoming lab test requests and input results.</p>
      </div>

      <div className="flex gap-8 border-b border-gray-100">
        <button 
          className={`pb-4 text-[14px] font-medium transition-colors relative ${activeTab === 'pending' ? 'text-[#0052CC]' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Tests
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0052CC] rounded-t-full"></div>}
        </button>
        <button 
          className={`pb-4 text-[14px] font-medium transition-colors relative ${activeTab === 'completed' ? 'text-[#0052CC]' : 'text-gray-500 hover:text-gray-800'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Tests
          {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0052CC] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden mt-8">
          <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-gray-800">Pending Lab Tests</h3>
            <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {groupedPendingTests?.length || 0}
            </span>
          </div>
          <div className="overflow-x-auto">
            {isLoadingPending ? (
              <div className="p-4"><LoadingRows rows={5} cols={4} /></div>
            ) : errorPending ? (
              <div className="py-12"><EmptyState icon={Beaker} title="Couldn't load queue" /></div>
            ) : !pendingTests?.length ? (
              <div className="py-12"><EmptyState icon={CheckCircle2} title="All caught up!" description="No pending lab tests." /></div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-normal">Tests Requested</th>
                    <th className="px-6 py-4 font-normal">Requested For</th>
                    <th className="px-6 py-4 font-normal">Time Requested</th>
                    <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {groupedPendingTests.map(group => (
                    <tr 
                      key={group.case_id} 
                      className={`transition-colors group cursor-pointer ${group.severity === 'severe' ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50/50'}`}
                      onClick={() => {
                        setResultDialog({ open: true, caseGroup: group })
                        setResultsData({})
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {group.tests.map(t => (
                            <span key={t.test_id} className="text-gray-700 text-[13px] font-medium">{t.test_name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 text-[13px]">{group.student_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{group.admission_code}</div>
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          Case #{group.case_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">
                        {formatRelative(group.requested_at)}
                        {group.severity === 'severe' && (
                          <div className="mt-1.5 flex items-center gap-1 text-red-600 text-[10px] font-medium uppercase tracking-wide bg-red-50 w-max px-1.5 py-0.5 rounded border border-red-100">
                            <AlertCircle className="w-3 h-3" /> Priority
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${group.case_id}`);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                            title="View Case Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#0052CC]/90 hover:bg-[#0047B3] rounded-lg shadow-sm transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResultDialog({ open: true, caseGroup: group })
                              setResultsData({})
                            }}
                          >
                            Enter Results
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
      )}

      {activeTab === 'completed' && (
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden mt-8">
          <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-gray-800">Recently Completed</h3>
            <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {completedTests?.length || 0}
            </span>
          </div>
          <div className="overflow-x-auto">
            {isLoadingCompleted ? (
              <div className="p-4"><LoadingRows rows={5} cols={4} /></div>
            ) : errorCompleted ? (
              <div className="py-12"><EmptyState icon={FileText} title="Couldn't load history" /></div>
            ) : !completedTests?.length ? (
              <div className="py-12"><EmptyState icon={FileText} title="No history found" description="You haven't completed any lab tests yet." /></div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-gray-500 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-normal">Test Name</th>
                    <th className="px-6 py-4 font-normal">Requested For</th>
                    <th className="px-6 py-4 font-normal w-1/3">Results</th>
                    <th className="px-6 py-4 font-normal">Completed At</th>
                    <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {completedTests.map(test => (
                    <tr key={test.test_id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-700 text-[13px] font-medium">{test.test_name}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 text-[13px]">{test.student_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{test.admission_code}</div>
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          Case #{test.case_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px] whitespace-normal">
                        <div className="line-clamp-2 text-[13px] text-gray-600 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                          {test.results}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">{formatRelative(test.fulfilled_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/cases/${test.case_id}`)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                            title="View Case Details"
                          >
                            <Eye className="w-5 h-5" />
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
      )}

      <Dialog open={resultDialog.open} onOpenChange={(open) => !open && setResultDialog({ open: false, caseGroup: null })}>
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-lg bg-white/50 backdrop-blur-2xl border border-white/60 sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight">Enter Lab Results</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 mt-1">
                Record findings for {resultDialog.caseGroup?.tests.length} test{resultDialog.caseGroup?.tests.length > 1 ? 's' : ''} (Student: {resultDialog.caseGroup?.student_name})
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">1</span>
              Test Results
            </div>
            
            <div className="ml-8 space-y-6">
              {resultDialog.caseGroup?.tests.map(test => (
                <div key={test.test_id}>
                  <label className="block text-[13px] font-medium text-gray-800 mb-1.5">{test.test_name}</label>
                  <Textarea 
                    value={resultsData[test.test_id] || ''} 
                    onChange={(e) => setResultsData({...resultsData, [test.test_id]: e.target.value})} 
                    placeholder={`Enter results for ${test.test_name}...`}
                    className="min-h-[80px] text-[14px] resize-none border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 shrink-0">
            <button 
              className="px-5 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 bg-white/40 border border-white/50 rounded-lg transition-colors shadow-sm" 
              onClick={() => setResultDialog({ open: false, caseGroup: null })}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2 text-[14px] font-medium text-white bg-[#0052CC]/90 hover:bg-[#0047B3] disabled:opacity-50 backdrop-blur-sm rounded-lg shadow-sm transition-colors flex items-center gap-2" 
              onClick={submitResults}
              disabled={updateMutation.isPending || Object.values(resultsData).every(v => !v.trim())}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Results
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
