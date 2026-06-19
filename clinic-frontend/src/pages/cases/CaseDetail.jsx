import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCaseById, closeCase, addFindings, addLabTest, addMedication, transferCase, escalateCase } from '@/api/cases.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth, useRole } from '@/hooks'
import { formatRelative } from '@/utils/formatDate'
import { Activity, Beaker, FileText, Pill, ArrowLeft, Loader2, Ambulance, UserPlus, Stethoscope } from 'lucide-react'
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

  if (isLoading) return <div className="p-8 text-center text-text-muted">Loading case details...</div>
  if (!c) return <div className="p-8 text-center text-danger">Case not found.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          Case #{c.case_id || id} 
          <StatusPill status={c.status} />
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Case Details & Triage */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-text-primary mb-4">Student Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Name</div>
                <div className="font-medium">{c.student.first_name} {c.student.last_name}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Grade/Class</div>
                <div>{c.student.grade} {c.student.class}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Opened</div>
                <div>{formatRelative(c.created_at)} by {c.opened_by || 'Nurse'}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate(`/students/${c.student.id}`)}>
              View full profile
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" /> Vitals
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Temp:</span>
                <span className="font-medium">{c.temperature ? `${c.temperature}°C` : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">BP:</span>
                <span className="font-medium">{c.blood_pressure || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Heart Rate:</span>
                <span className="font-medium">{c.heart_rate ? `${c.heart_rate} bpm` : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Resp:</span>
                <span className="font-medium">{c.respiratory_rate ? `${c.respiratory_rate}/min` : '--'}</span>
              </div>
            </div>
          </div>

          {(c.status === 'open' || c.status === 'pending_transfer') && (isDoctor || isNurse) && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setFindingsDialog(true)}
              >
                <FileText className="w-4 h-4 mr-2" /> Add Clinical Findings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setMedicationDialog(true)}
              >
                <Pill className="w-4 h-4 mr-2" /> Prescribe Medication
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setLabTestDialog(true)}
              >
                <Beaker className="w-4 h-4 mr-2" /> Request Lab Test
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left text-brand hover:bg-brand-light hover:text-brand-dark"
                onClick={() => setEscalateDialog(true)}
                disabled={isNurse && (c.lab_tests?.some(l => !l.results) || false)}
                title={isNurse && (c.lab_tests?.some(l => !l.results) || false) ? "Cannot escalate before lab results are ready" : ""}
              >
                <Stethoscope className="w-4 h-4 mr-2" /> Send to Doctor
              </Button>
              {isDoctor && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left text-danger hover:bg-danger-bg hover:text-danger border-danger/30"
                  onClick={() => setTransferDialog(true)}
                >
                  <Ambulance className="w-4 h-4 mr-2" /> Request External Transfer
                </Button>
              )}
              <Button 
                className="w-full bg-brand text-white hover:bg-brand-dark"
                onClick={() => closeMutation.mutate(id)}
                disabled={closeMutation.isPending || (c.lab_tests?.some(l => !l.results) || false) || (isNurse && c.needs_doctor)}
                title={(c.lab_tests?.some(l => !l.results) || false) ? "Cannot close case with pending labs" : (isNurse && c.needs_doctor) ? "Cannot close escalated case" : ""}
              >
                {closeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Close Case
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Feed */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-text-primary mb-2">Chief Complaint</h3>
            <p className="text-text-primary bg-[#F5F7F5] p-3 rounded-lg border border-border">
              {c.complaint}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-[#FDFEFC]">
              <h3 className="font-semibold text-text-primary">Clinical Feed</h3>
            </div>
            <div className="p-0">
              {c.findings?.length > 0 || c.lab_tests?.length > 0 || c.medications?.length > 0 || c.transfer || c.status === 'closed' ? (
                <div className="divide-y divide-border">
                  {c.findings?.map((f, i) => (
                    <div key={`f-${i}`} className="p-4 flex gap-4">
                      <div className="mt-1 bg-brand-light p-2 rounded-full h-8 w-8 flex items-center justify-center text-brand">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-1">Clinical Finding <span className="text-text-muted font-normal">by {f.added_by_name}</span></div>
                        <div className="text-sm text-text-primary whitespace-pre-wrap">{f.findings}</div>
                        <div className="text-xs text-text-muted mt-2">{formatRelative(f.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {c.lab_tests?.map((l, i) => (
                    <div key={`l-${i}`} className="p-4 flex gap-4">
                      <div className="mt-1 bg-purple-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-purple-600">
                        <Beaker className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-1">Lab Test: {l.test_name} <StatusPill status={l.status} className="ml-2 scale-90 origin-left" /></div>
                        {l.results && <div className="text-sm text-text-primary mt-2 bg-gray-50 p-2 rounded border border-gray-200">{l.results}</div>}
                        <div className="text-xs text-text-muted mt-2">{formatRelative(l.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {c.medications?.map((m, i) => (
                    <div key={`m-${i}`} className="p-4 flex gap-4">
                      <div className="mt-1 bg-green-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-green-600">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-1">Medication: {m.drug_name} ({m.dosage}) <span className="text-text-muted font-normal">by {m.prescribed_by_role}</span></div>
                        {m.instructions && <div className="text-sm text-text-primary mt-1">{m.instructions}</div>}
                        <div className="text-xs text-text-muted mt-2">{formatRelative(m.prescribed_at)}</div>
                      </div>
                    </div>
                  ))}
                  {c.transfer && (
                    <div className="p-4 flex gap-4">
                      <div className="mt-1 bg-red-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-red-600">
                        <Ambulance className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-1">External Transfer <StatusPill status={c.transfer.status} className="ml-2 scale-90 origin-left" /> <span className="text-text-muted font-normal">by {c.transfer.initiated_by_name}</span></div>
                        <div className="text-sm text-text-primary mt-1">To: {c.transfer.hospital_name}</div>
                        {c.transfer.reason && <div className="text-sm text-text-primary mt-1">Reason: {c.transfer.reason}</div>}
                        <div className="text-xs text-text-muted mt-2">{formatRelative(c.transfer.created_at)}</div>
                      </div>
                    </div>
                  )}
                  {c.status === 'closed' && c.closed_by_name && (
                    <div className="p-4 flex gap-4">
                      <div className="mt-1 bg-gray-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-gray-600">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm mb-1">Case Closed <span className="text-text-muted font-normal">by {c.closed_by_name}</span></div>
                        <div className="text-xs text-text-muted mt-2">{formatRelative(c.closed_at)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-text-muted">
                  No clinical notes or actions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={findingsDialog} onOpenChange={setFindingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Clinical Findings</DialogTitle>
          </DialogHeader>
          <Textarea 
            value={findingsText} 
            onChange={e => setFindingsText(e.target.value)} 
            placeholder="Enter clinical observations..."
            className="min-h-[100px] mt-4"
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setFindingsDialog(false)}>Cancel</Button>
            <Button className="bg-brand text-white" onClick={() => findingsMutation.mutate({ id, notes: findingsText })}>Save Findings</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request External Transfer</DialogTitle>
            <DialogDescription>
              Record the hospital destination and reason for transferring this student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Hospital Name</label>
              <Input value={hospital} onChange={e => setHospital(e.target.value)} placeholder="e.g. District Hospital" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for transfer</label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Required care exceeds clinic capabilities..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setTransferDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => transferMutation.mutate({ id, hospital_name: hospital, reason })} disabled={!hospital || !reason}>
              Request Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescribe Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Drug Name</label>
              <Input value={drugName} onChange={e => setDrugName(e.target.value)} placeholder="e.g. Paracetamol" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dosage</label>
              <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Instructions</label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Take twice daily after meals..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setMedicationDialog(false)}>Cancel</Button>
            <Button className="bg-brand text-white" onClick={() => medicationMutation.mutate({ id, drug_name: drugName, dosage, instructions })} disabled={!drugName || !dosage}>
              Prescribe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={labTestDialog} onOpenChange={setLabTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Lab Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Test Name</label>
              <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Malaria Rapid Test" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setLabTestDialog(false)}>Cancel</Button>
            <Button className="bg-brand text-white" onClick={() => labTestMutation.mutate({ id, test_name: testName })} disabled={!testName}>
              Request Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Doctor</DialogTitle>
            <DialogDescription>
              Escalate this case to a doctor. This will flag it in the doctor's queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for escalation (Optional)</label>
              <Textarea value={escalateNotes} onChange={e => setEscalateNotes(e.target.value)} placeholder="Explain why the doctor needs to review this case..." className="min-h-[100px]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEscalateDialog(false)}>Cancel</Button>
            <Button className="bg-brand text-white" onClick={() => escalateMutation.mutate({ id, notes: escalateNotes })}>
              Send to Doctor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
