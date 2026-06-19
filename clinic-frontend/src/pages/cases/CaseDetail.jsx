import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCaseById, closeCase, addFindings, addLabTest, addMedication, transferCase, escalateCase } from '@/api/cases.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuth, useRole } from '@/hooks'
import { formatRelative } from '@/utils/formatDate'
import { Activity, Beaker, FileText, Pill, ArrowLeft, Loader2, Ambulance, UserCircle, Stethoscope, ChevronRight, CheckCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDoctor, isNurse } = useRole()
  const queryClient = useQueryClient()

  const { data: c, isLoading } = useQuery({ queryKey: ['case', id], queryFn: () => getCaseById(id) })

  const [findingsDialog, setFindingsDialog] = useState(false)
  const [findingsText, setFindingsText] = useState('')
  
  const [transferDialog, setTransferDialog] = useState(false)
  const [hospital, setHospital] = useState('')
  const [reason, setReason] = useState('')

  const [medicationDialog, setMedicationDialog] = useState(false)
  const [drugName, setDrugName] = useState('')
  const [dosage, setDosage] = useState('')
  const [instructions, setInstructions] = useState('')

  const [labTestDialog, setLabTestDialog] = useState(false)
  const [testName, setTestName] = useState('')

  const [escalateDialog, setEscalateDialog] = useState(false)
  const [escalateNotes, setEscalateNotes] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['case', id] })

  const findingsMutation = useMutation({
    mutationFn: addFindings,
    onSuccess: () => {
      invalidate()
      toast.success('Findings added')
      setFindingsDialog(false)
      setFindingsText('')
    }
  })

  const closeMutation = useMutation({
    mutationFn: closeCase,
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case closed successfully')
    }
  })

  const transferMutation = useMutation({
    mutationFn: transferCase,
    onSuccess: () => {
      invalidate()
      toast.success('Transfer requested')
      setTransferDialog(false)
    }
  })

  const medicationMutation = useMutation({
    mutationFn: addMedication,
    onSuccess: () => {
      invalidate()
      toast.success('Medication prescribed')
      setMedicationDialog(false)
      setDrugName('')
      setDosage('')
      setInstructions('')
    }
  })

  const labTestMutation = useMutation({
    mutationFn: addLabTest,
    onSuccess: () => {
      invalidate()
      toast.success('Lab test requested')
      setLabTestDialog(false)
      setTestName('')
    }
  })

  const escalateMutation = useMutation({
    mutationFn: escalateCase,
    onSuccess: () => {
      invalidate()
      toast.success('Case escalated to doctor')
      setEscalateDialog(false)
      setEscalateNotes('')
    }
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-sans">Loading case details...</div>
  if (!c) return <div className="p-8 text-center text-red-500 font-sans">Case not found.</div>

  const isOpen = c.status === 'open' || c.status === 'pending_transfer';
  const disableClose = closeMutation.isPending || (c.lab_tests?.some(l => !l.results) || false) || (isNurse && c.needs_doctor);
  const disableEscalate = isNurse && (c.lab_tests?.some(l => !l.results) || false);

  return (
    <div className="space-y-6 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans mx-auto">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Case #{c.case_id || id}</h1>
            <StatusPill status={c.status} />
          </div>
          <p className="text-gray-500 mt-1 text-[14px]">Manage student case details, clinical findings, and actions.</p>
        </div>
      </div>

      {/* Unified Single Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100/80 overflow-hidden flex flex-col">
        
        {/* Actions Bar (Top of Card) */}
        <div className="bg-[#F8FAFC] border-b border-gray-100 p-4 px-6 flex flex-wrap gap-3 items-center">
          <button 
            onClick={() => navigate(`/students/${c.student.id}`)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
          >
            <UserCircle className="w-4 h-4 text-gray-500" />
            View Profile
          </button>

          {isOpen && (isDoctor || isNurse) && (
            <>
              <button 
                onClick={() => setFindingsDialog(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Clinical Findings
              </button>
              
              <button 
                onClick={() => setMedicationDialog(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                <Pill className="w-4 h-4 text-green-500" />
                Prescribe Medication
              </button>
              
              <button 
                onClick={() => setLabTestDialog(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                <Beaker className="w-4 h-4 text-purple-500" />
                Request Lab Test
              </button>

              <button 
                onClick={() => setEscalateDialog(true)}
                disabled={disableEscalate}
                title={disableEscalate ? "Cannot escalate before lab results are ready" : ""}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 text-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                <Stethoscope className="w-4 h-4 text-orange-500" />
                Send to Doctor
              </button>

              {isDoctor && (
                <button 
                  onClick={() => setTransferDialog(true)}
                  className="flex items-center gap-2 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
                >
                  <Ambulance className="w-4 h-4 text-red-500" />
                  Transfer
                </button>
              )}

              <div className="flex-1"></div> {/* Spacer */}

              <button 
                onClick={() => closeMutation.mutate(id)}
                disabled={disableClose}
                title={disableClose ? "Cannot close case with pending labs or escalation" : ""}
                className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white disabled:opacity-50 disabled:hover:bg-[#0052CC] px-5 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                {closeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Close Case
              </button>
            </>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-10">
          
          {/* Row 1: Student Info & Vitals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Student Info */}
            <div>
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserCircle className="w-4 h-4" /> Student Information
              </h3>
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[12px] text-gray-500 mb-0.5">Full Name</div>
                    <div className="text-[15px] font-medium text-gray-800">{c.student.first_name} {c.student.last_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-gray-500 mb-0.5">Grade / Class</div>
                    <div className="text-[15px] font-medium text-gray-800">{c.student.grade} {c.student.class}</div>
                  </div>
                </div>
                <div className="h-px w-full bg-gray-200/60"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[12px] text-gray-500 mb-0.5">Opened By</div>
                    <div className="text-[14px] text-gray-800">{c.opened_by || 'Nurse'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-gray-500 mb-0.5">Date Opened</div>
                    <div className="text-[14px] text-gray-800">{formatRelative(c.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Vitals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFF8F1] border border-[#FFEDD5] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-orange-600/70 uppercase tracking-wide mb-1">Temp</span>
                  <span className="text-lg font-semibold text-orange-900">{c.temperature ? `${c.temperature}°C` : '--'}</span>
                </div>
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-green-600/70 uppercase tracking-wide mb-1">BP</span>
                  <span className="text-lg font-semibold text-green-900">{c.blood_pressure || '--'}</span>
                </div>
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-red-600/70 uppercase tracking-wide mb-1">Heart</span>
                  <span className="text-lg font-semibold text-red-900">{c.heart_rate ? `${c.heart_rate}` : '--'}<span className="text-[11px] font-normal ml-0.5">bpm</span></span>
                </div>
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-blue-600/70 uppercase tracking-wide mb-1">Resp</span>
                  <span className="text-lg font-semibold text-blue-900">{c.respiratory_rate ? `${c.respiratory_rate}` : '--'}<span className="text-[11px] font-normal ml-0.5">/min</span></span>
                </div>
              </div>
            </div>

          </div>

          <div className="h-px w-full bg-gray-100"></div>

          {/* Chief Complaint */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Chief Complaint
            </h3>
            <div className="text-[15px] leading-relaxed text-gray-800 bg-[#F8FAFC] p-5 rounded-xl border border-gray-100">
              {c.complaint}
            </div>
          </div>

          {/* Clinical Feed */}
          <div>
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Clinical Feed
            </h3>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {c.findings?.length > 0 || c.lab_tests?.length > 0 || c.medications?.length > 0 || c.transfer || c.status === 'closed' ? (
                <div className="divide-y divide-gray-100">
                  
                  {/* Findings */}
                  {c.findings?.map((f, i) => (
                    <div key={`f-${i}`} className="p-5 flex gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="mt-0.5 bg-blue-50 text-blue-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-semibold text-gray-800 text-[14px]">Clinical Finding</div>
                          <div className="text-[12px] text-gray-400">{formatRelative(f.created_at)}</div>
                        </div>
                        <div className="text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed mb-2">{f.findings}</div>
                        <div className="text-[12px] font-medium text-gray-500">Added by {f.added_by_name}</div>
                      </div>
                    </div>
                  ))}

                  {/* Lab Tests */}
                  {c.lab_tests?.map((l, i) => (
                    <div key={`l-${i}`} className="p-5 flex gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="mt-0.5 bg-purple-50 text-purple-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <Beaker className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800 text-[14px]">Lab Test: {l.test_name}</span>
                            <StatusPill status={l.status} className="scale-90 origin-left" />
                          </div>
                          <div className="text-[12px] text-gray-400">{formatRelative(l.created_at)}</div>
                        </div>
                        {l.results && (
                          <div className="text-[14px] text-gray-700 bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-2 font-mono">
                            {l.results}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Medications */}
                  {c.medications?.map((m, i) => (
                    <div key={`m-${i}`} className="p-5 flex gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="mt-0.5 bg-green-50 text-green-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-semibold text-gray-800 text-[14px]">
                            Prescription: {m.drug_name} <span className="text-gray-500 font-normal">({m.dosage})</span>
                          </div>
                          <div className="text-[12px] text-gray-400">{formatRelative(m.prescribed_at)}</div>
                        </div>
                        {m.instructions && <div className="text-[14px] text-gray-600 mb-2">{m.instructions}</div>}
                        <div className="text-[12px] font-medium text-gray-500">Prescribed by {m.prescribed_by_role}</div>
                      </div>
                    </div>
                  ))}

                  {/* Transfer */}
                  {c.transfer && (
                    <div className="p-5 flex gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="mt-0.5 bg-red-50 text-red-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <Ambulance className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800 text-[14px]">External Transfer</span>
                            <StatusPill status={c.transfer.status} className="scale-90 origin-left" />
                          </div>
                          <div className="text-[12px] text-gray-400">{formatRelative(c.transfer.created_at)}</div>
                        </div>
                        <div className="text-[14px] text-gray-700 bg-red-50/30 border border-red-100 p-3 rounded-lg mb-2">
                          <div className="mb-1"><span className="font-medium text-gray-800">To:</span> {c.transfer.hospital_name}</div>
                          {c.transfer.reason && <div><span className="font-medium text-gray-800">Reason:</span> {c.transfer.reason}</div>}
                        </div>
                        <div className="text-[12px] font-medium text-gray-500">Initiated by {c.transfer.initiated_by_name}</div>
                      </div>
                    </div>
                  )}

                  {/* Case Closed */}
                  {c.status === 'closed' && c.closed_by_name && (
                    <div className="p-5 flex gap-4 bg-gray-50/80">
                      <div className="mt-0.5 bg-gray-200 text-gray-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-800 text-[14px]">Case Closed</div>
                          <div className="text-[12px] text-gray-500">{formatRelative(c.closed_at)}</div>
                        </div>
                        <div className="text-[13px] text-gray-600 mt-1">Closed by {c.closed_by_name}</div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-[14px]">No clinical notes or actions recorded yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      <Dialog open={findingsDialog} onOpenChange={setFindingsDialog}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-gray-800">Add Clinical Findings</DialogTitle>
          </DialogHeader>
          <Textarea 
            value={findingsText} 
            onChange={e => setFindingsText(e.target.value)} 
            placeholder="Enter clinical observations..."
            className="min-h-[120px] mt-2 text-[14px] resize-none"
          />
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setFindingsDialog(false)}>Cancel</button>
            <button className="px-5 py-2 text-[13px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] rounded-lg transition-colors shadow-sm" onClick={() => findingsMutation.mutate({ id, notes: findingsText })}>Save Findings</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-gray-800">Request External Transfer</DialogTitle>
            <DialogDescription className="text-[13px]">
              Record the hospital destination and reason for transferring this student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Hospital Name</label>
              <Input value={hospital} onChange={e => setHospital(e.target.value)} placeholder="e.g. District Hospital" className="text-[14px]" />
            </div>
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Reason for transfer</label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Required care exceeds clinic capabilities..." className="text-[14px] resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setTransferDialog(false)}>Cancel</button>
            <button className="px-5 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50" onClick={() => transferMutation.mutate({ id, hospital_name: hospital, reason })} disabled={!hospital || !reason}>
              Request Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-gray-800">Prescribe Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Drug Name</label>
              <Input value={drugName} onChange={e => setDrugName(e.target.value)} placeholder="e.g. Paracetamol" className="text-[14px]" />
            </div>
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Dosage</label>
              <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg" className="text-[14px]" />
            </div>
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Instructions</label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Take twice daily after meals..." className="text-[14px] resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setMedicationDialog(false)}>Cancel</button>
            <button className="px-5 py-2 text-[13px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] rounded-lg transition-colors shadow-sm disabled:opacity-50" onClick={() => medicationMutation.mutate({ id, drug_name: drugName, dosage, instructions })} disabled={!drugName || !dosage}>
              Prescribe
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={labTestDialog} onOpenChange={setLabTestDialog}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-gray-800">Request Lab Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Test Name</label>
              <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Malaria Rapid Test" className="text-[14px]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setLabTestDialog(false)}>Cancel</button>
            <button className="px-5 py-2 text-[13px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] rounded-lg transition-colors shadow-sm disabled:opacity-50" onClick={() => labTestMutation.mutate({ id, test_name: testName })} disabled={!testName}>
              Request Test
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-gray-800">Send to Doctor</DialogTitle>
            <DialogDescription className="text-[13px]">
              Escalate this case to a doctor. This will flag it in the doctor's queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-gray-700">Reason for escalation (Optional)</label>
              <Textarea value={escalateNotes} onChange={e => setEscalateNotes(e.target.value)} placeholder="Explain why the doctor needs to review this case..." className="min-h-[100px] text-[14px] resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setEscalateDialog(false)}>Cancel</button>
            <button className="px-5 py-2 text-[13px] font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-sm" onClick={() => escalateMutation.mutate({ id, notes: escalateNotes })}>
              Send to Doctor
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
