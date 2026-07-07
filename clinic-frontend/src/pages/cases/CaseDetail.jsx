import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCaseById, closeCase, addFindings, addLabTest, addMedication, transferCase, escalateCase, toggleFollowUp } from '@/api/cases.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuth, useRole } from '@/hooks'
import { formatRelative } from '@/utils/formatDate'
import { Activity, Beaker, FileText, Pill, ArrowLeft, Loader2, Ambulance, UserCircle, Stethoscope, ChevronRight, CheckCircle, Plus, Search, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

const LAB_CATEGORIES = [
  {
    id: 'hematology',
    name: 'Hematology',
    tests: [
      'Full Blood Count (FBC)', 'White Blood Cells (WBC)', 'Lymphocytes (LYM)', 'Granulocytes (GRAN)',
      'MID', 'Red Blood Cells (RBC)', 'Hemoglobin (HGB)', 'Hematocrit (HCT)', 'Mean Corpuscular Volume (MCV)',
      'Platelets (PLT)', 'Bleeding Time (BT/BS)', 'Clotting Time (TC/CT)', 'ESR (VS/ESR)', 'Blood Group', 'Rhesus Factor (Rh)'
    ]
  },
  {
    id: 'urine',
    name: 'Urine Chemistry & Bacteriology',
    tests: [
      'Albuminuria', 'Glucosuria', 'Ketone Bodies', 'Blood', 'pH', 'Leucocyte', 'Bilirubinuria',
      'Urobilinogen', 'Density', 'Specific Gravity', 'Appearance (ECBU)', 'Cytology (ECBU)', 'Gram Stain (ECBU)'
    ]
  },
  {
    id: 'biochemistry',
    name: 'Blood Biochemistry',
    tests: [
      'Random Glucose', 'Urea', 'Creatinine', 'AST (SGOT)', 'ALT (SGPT)', 'Gamma GT', 'Direct Bilirubin',
      'Total Bilirubin', 'Alkaline Phosphatase', 'Albumin', 'Total Cholesterol', 'HDL Cholesterol',
      'LDL Cholesterol', 'Triglycerides', 'Uric Acid', 'Amylase', 'Lipase'
    ]
  },
  {
    id: 'serology',
    name: 'Serology',
    tests: [
      'HBsAg', 'HCV Antibody', 'HIV', 'COVID-19', 'Pregnancy Test (Urine)', 'Pregnancy Test (Blood)',
      'Syphilis', 'TPHA', 'Streptococci', 'ASLO', 'H. Pylori (Blood)', 'H. Pylori (Stool)', 'CRP', 'Arthritis Test'
    ]
  },
  {
    id: 'parasitology',
    name: 'Parasitology & Bacteriology',
    tests: [
      'Giemsa (Blood)', 'Malaria Antigen (Blood)', 'Macroscopic (Stool)', 'Microscopic (Stool)',
      'Cytology (FY/FU)', 'Gram Stain (FY/FU)'
    ]
  }
];

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
  const [selectedTests, setSelectedTests] = useState([])
  const [labNotes, setLabNotes] = useState('')
  const [labSearch, setLabSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(['hematology'])

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
      toast.success('Lab tests requested')
      setLabTestDialog(false)
      setSelectedTests([])
      setLabNotes('')
      setLabSearch('')
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

  const followUpMutation = useMutation({
    mutationFn: () => toggleFollowUp(id),
    onSuccess: () => {
      invalidate()
      toast.success('Follow-up status updated')
    }
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-sans">Loading case details...</div>
  if (!c) return <div className="p-8 text-center text-red-500 font-sans">Case not found.</div>

  const isOpen = c.status === 'open' || c.status === 'pending_transfer';
  const disableClose = closeMutation.isPending || (c.lab_tests?.some(l => !l.results) || false) || (isNurse && c.needs_doctor);
  const disableEscalate = isNurse && (c.lab_tests?.some(l => !l.results) || false);

  // Build Chronological Timeline
  const timeline = []
  if (c.findings) {
    timeline.push(...c.findings.map(f => ({ ...f, _type: 'finding', _date: new Date(f.created_at) })))
  }
  if (c.lab_tests) {
    timeline.push(...c.lab_tests.map(l => ({ ...l, _type: 'lab_test', _date: new Date(l.requested_at) })))
  }
  if (c.medications) {
    timeline.push(...c.medications.map(m => ({ ...m, _type: 'medication', _date: new Date(m.prescribed_at) })))
  }
  if (c.transfer) {
    timeline.push({ ...c.transfer, _type: 'transfer', _date: new Date(c.transfer.created_at) })
  }
  if (c.status === 'closed' && c.closed_by_name) {
    timeline.push({ _type: 'closed', _date: new Date(c.closed_at), closed_by_name: c.closed_by_name, closed_at: c.closed_at })
  }

  // Sort timeline chronologically (oldest first)
  timeline.sort((a, b) => a._date - b._date)

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

      {/* Action Bar Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 p-4 px-6 flex flex-wrap gap-3 items-center">
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

            {isNurse && (
              <button
                onClick={() => setEscalateDialog(true)}
                disabled={disableEscalate}
                title={disableEscalate ? "Cannot escalate before lab results are ready" : ""}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 text-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
              >
                <Stethoscope className="w-4 h-4 text-orange-500" />
                Send to Doctor
              </button>
            )}

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
              title={disableClose ? "Cannot close case with pending labs or escalation" : (c.transfer ? "Only close case once student comes back" : "")}
              className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047B3] text-white disabled:opacity-50 disabled:hover:bg-[#0052CC] px-5 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm"
            >
              {closeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {c.transfer ? "Close Case (Student Returned)" : "Close Case"}
            </button>
          </>
        )}

        {!isOpen && (isDoctor || isNurse) && (
          <>
            <div className="flex-1"></div> {/* Spacer */}
            <button
              onClick={() => followUpMutation.mutate()}
              disabled={followUpMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm ${c.needs_follow_up
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {followUpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {c.needs_follow_up ? 'Follow-up Needed' : 'Flag for Follow-up'}
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Overview & Context */}
        <div className="lg:col-span-1 space-y-6">

          {/* Student Info Card */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="p-5 border-b border-gray-100/80">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <UserCircle className="w-4 h-4" /> Patient Info
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
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
              <div className="h-px w-full bg-gray-100"></div>
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

          {/* Vitals Card */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="p-5 border-b border-gray-100/80">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Vitals
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
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

        </div>

        {/* RIGHT COLUMN: Clinical Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chief Complaint Card */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="p-5 border-b border-gray-100/80">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Chief Complaint
              </h3>
            </div>
            <div className="p-6 text-[15px] leading-relaxed text-gray-800 bg-[#F8FAFC]">
              {c.complaint}
            </div>
          </div>

          {/* Clinical Feed Card */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/80 overflow-hidden">
            <div className="p-5 border-b border-gray-100/80">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Clinical Feed
              </h3>
            </div>

            <div className="bg-white">
              {timeline.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {timeline.map((item, i) => {
                    if (item._type === 'finding') {
                      return (
                        <div key={`timeline-${i}`} className="p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="mt-0.5 bg-blue-50 text-blue-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="font-semibold text-gray-800 text-[14px]">Clinical Finding</div>
                              <div className="text-[12px] text-gray-400">{formatRelative(item.created_at)}</div>
                            </div>
                            <div className="text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed mb-2">{item.findings}</div>
                            <div className="text-[12px] font-medium text-gray-500">Added by {item.added_by_name}</div>
                          </div>
                        </div>
                      )
                    }

                    if (item._type === 'lab_test') {
                      return (
                        <div key={`timeline-${i}`} className="p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="mt-0.5 bg-purple-50 text-purple-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                            <Beaker className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800 text-[14px]">Lab Test: {item.test_name}</span>
                                <StatusPill status={item.status} className="scale-90 origin-left" />
                              </div>
                              <div className="text-[12px] text-gray-400">{formatRelative(item.requested_at)}</div>
                            </div>
                            {item.notes && (
                              <div className="text-[13px] text-gray-600 bg-gray-50/50 border border-gray-100 p-2.5 rounded-lg mb-2">
                                <span className="font-medium">Notes:</span> {item.notes}
                              </div>
                            )}
                            {item.results && (
                              <div className="text-[14px] text-gray-700 bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-2 font-mono">
                                {item.results}
                              </div>
                            )}
                            <div className="text-[12px] font-medium text-gray-500">Requested by {item.requested_by_name}</div>
                          </div>
                        </div>
                      )
                    }

                    if (item._type === 'medication') {
                      return (
                        <div key={`timeline-${i}`} className="p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="mt-0.5 bg-green-50 text-green-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="font-semibold text-gray-800 text-[14px]">
                                Prescription: {item.drug_name} <span className="text-gray-500 font-normal">({item.dosage})</span>
                              </div>
                              <div className="text-[12px] text-gray-400">{formatRelative(item.prescribed_at)}</div>
                            </div>
                            {item.instructions && <div className="text-[14px] text-gray-600 mb-2">{item.instructions}</div>}
                            <div className="text-[12px] font-medium text-gray-500">Prescribed by {item.prescribed_by_name}</div>
                          </div>
                        </div>
                      )
                    }

                    if (item._type === 'transfer') {
                      return (
                        <div key={`timeline-${i}`} className="p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="mt-0.5 bg-red-50 text-red-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                            <Ambulance className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800 text-[14px]">External Transfer</span>
                                <StatusPill status={item.status} className="scale-90 origin-left" />
                              </div>
                              <div className="text-[12px] text-gray-400">{formatRelative(item.created_at)}</div>
                            </div>
                            <div className="text-[14px] text-gray-700 bg-red-50/30 border border-red-100 p-3 rounded-lg mb-2">
                              <div className="mb-1"><span className="font-medium text-gray-800">To:</span> {item.hospital_name}</div>
                              {item.reason && <div><span className="font-medium text-gray-800">Reason:</span> {item.reason}</div>}
                            </div>
                            <div className="text-[12px] font-medium text-gray-500">Initiated by {item.initiated_by_name}</div>
                          </div>
                        </div>
                      )
                    }

                    if (item._type === 'closed') {
                      return (
                        <div key={`timeline-${i}`} className="p-6 flex gap-4 bg-gray-50/80">
                          <div className="mt-0.5 bg-gray-200 text-gray-600 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-800 text-[14px]">Case Closed</div>
                              <div className="text-[12px] text-gray-500">{formatRelative(item.closed_at)}</div>
                            </div>
                            <div className="text-[13px] text-gray-600 mt-1">Closed by {item.closed_by_name}</div>
                          </div>
                        </div>
                      )
                    }

                    return null;
                  })}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
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
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-2xl bg-white/50 backdrop-blur-2xl border border-white/60 sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight">Add Clinical Findings</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 mt-1">Record new clinical observations for this case.</DialogDescription>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">1</span>
                Clinical Details
              </div>
              <div className="ml-8">
                <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Clinical Notes <span className="text-red-500">*</span></label>
                <Textarea
                  value={findingsText}
                  onChange={e => setFindingsText(e.target.value)}
                  placeholder="What are your clinical findings?"
                  className="min-h-[120px] text-[14px] resize-none border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 shrink-0">
            <button
              className="px-5 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 bg-white/40 border border-white/50 rounded-lg transition-colors shadow-sm"
              onClick={() => setFindingsDialog(false)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-[14px] font-medium text-white bg-[#0052CC]/90 hover:bg-[#0047B3] disabled:opacity-50 backdrop-blur-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              onClick={() => findingsMutation.mutate({ id, notes: findingsText })}
              disabled={!findingsText}
            >
              Save Findings
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-2xl bg-white/50 backdrop-blur-2xl border border-white/60 sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight">Request External Transfer</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 mt-1">Record the hospital destination and reason for transferring this student.</DialogDescription>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">1</span>
                Destination
              </div>
              <div className="ml-8">
                <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Hospital Name <span className="text-red-500">*</span></label>
                <Input
                  value={hospital}
                  onChange={e => setHospital(e.target.value)}
                  placeholder="e.g. District Hospital"
                  className="text-[14px] border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl h-11"
                />
              </div>
            </div>

            <div className="h-px bg-white/40 ml-8"></div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">2</span>
                Reason
              </div>
              <div className="ml-8">
                <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Reason for transfer <span className="text-red-500">*</span></label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Required care exceeds clinic capabilities..."
                  className="min-h-[100px] text-[14px] resize-none border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 shrink-0">
            <button
              className="px-5 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 bg-white/40 border border-white/50 rounded-lg transition-colors shadow-sm"
              onClick={() => setTransferDialog(false)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-[14px] font-medium text-white bg-red-600/90 hover:bg-red-700 disabled:opacity-50 backdrop-blur-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              onClick={() => transferMutation.mutate({ id, hospital_name: hospital, reason })}
              disabled={!hospital || !reason}
            >
              Request Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-2xl bg-white/50 backdrop-blur-2xl border border-white/60 sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight">Prescribe Medication</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 mt-1">Add a new medication prescription for this student.</DialogDescription>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">1</span>
                Drug Information
              </div>
              <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Drug Name <span className="text-red-500">*</span></label>
                  <Input
                    value={drugName}
                    onChange={e => setDrugName(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="text-[14px] border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl h-11"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Dosage <span className="text-red-500">*</span></label>
                  <Input
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="text-[14px] border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-white/40 ml-8"></div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-[#0052CC] text-[13px] font-bold backdrop-blur-sm border border-blue-500/10">2</span>
                Instructions
              </div>
              <div className="ml-8">
                <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Usage Instructions</label>
                <Textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Take twice daily after meals..."
                  className="min-h-[100px] text-[14px] resize-none border-black/15 bg-white/60 backdrop-blur-sm focus:border-[#0052CC] focus:bg-white/60 focus:ring-1 focus:ring-[#0052CC] rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 shrink-0">
            <button
              className="px-5 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 bg-white/40 border border-white/50 rounded-lg transition-colors shadow-sm"
              onClick={() => setMedicationDialog(false)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-[14px] font-medium text-white bg-[#0052CC]/90 hover:bg-[#0047B3] disabled:opacity-50 backdrop-blur-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              onClick={() => medicationMutation.mutate({ id, drug_name: drugName, dosage, instructions })}
              disabled={!drugName || !dosage}
            >
              Prescribe
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={labTestDialog} onOpenChange={(open) => {
        setLabTestDialog(open);
        if (!open) setLabSearch('');
      }}>
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-4xl bg-white/95 backdrop-blur-3xl border border-white/60 sm:max-h-[90vh] flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 bg-white/50 shrink-0 gap-4">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight flex items-center gap-2">
                <Beaker className="w-6 h-6 text-[#0052CC]" /> Request Laboratory Tests
              </DialogTitle>
              <DialogDescription className="text-[13px] text-gray-500 mt-1">Select the required tests and add any clinical notes for the laboratory.</DialogDescription>
            </div>
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={labSearch}
                onChange={e => setLabSearch(e.target.value)}
                placeholder="Search for tests..."
                className="pl-9 h-10 text-[13px] bg-white border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] rounded-xl shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#F8FAFC]/50 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {LAB_CATEGORIES.map(category => {
                const filteredTests = category.tests.filter(t => t.toLowerCase().includes(labSearch.toLowerCase()));
                if (filteredTests.length === 0) return null;

                const isExpanded = expandedCategories.includes(category.id);
                const toggleCategory = () => {
                  setExpandedCategories(prev =>
                    prev.includes(category.id) ? prev.filter(id => id !== category.id) : [...prev, category.id]
                  );
                };

                const allSelected = filteredTests.length > 0 && filteredTests.every(t => selectedTests.includes(t));
                const toggleAll = (e) => {
                  e.stopPropagation();
                  if (allSelected) {
                    setSelectedTests(prev => prev.filter(t => !filteredTests.includes(t)));
                  } else {
                    const newTests = filteredTests.filter(t => !selectedTests.includes(t));
                    setSelectedTests(prev => [...prev, ...newTests]);
                  }
                };

                return (
                  <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                    <button
                      onClick={toggleCategory}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          onClick={toggleAll}
                          className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 text-[#0052CC] hover:border-[#0052CC] transition-colors cursor-pointer bg-white"
                        >
                          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-50" />}
                        </div>
                        <span className="font-semibold text-[14px] text-gray-800">{category.name}</span>
                        <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-medium">
                          {filteredTests.length}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 p-4 pt-0 border-t border-gray-50 transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
                      {filteredTests.map(test => {
                        const isSelected = selectedTests.includes(test);
                        return (
                          <label key={test} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-center w-4 h-4 rounded border border-gray-300 text-[#0052CC]">
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-50" />}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedTests(prev =>
                                  isSelected ? prev.filter(t => t !== test) : [...prev, test]
                                )
                              }}
                            />
                            <span className={`text-[13px] ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{test}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {LAB_CATEGORIES.every(c => !c.tests.some(t => t.toLowerCase().includes(labSearch.toLowerCase()))) && (
                <div className="text-center py-12 text-gray-500 text-[14px]">
                  No tests found matching "{labSearch}"
                </div>
              )}
            </div>

            <div className="lg:w-[320px] shrink-0 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="text-[14px] font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Clinical Notes
                  <span className="text-[11px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                </h4>
                <Textarea
                  value={labNotes}
                  onChange={e => setLabNotes(e.target.value)}
                  placeholder="Add any specific instructions or context for the laboratory..."
                  className="min-h-[120px] text-[13px] resize-none border-gray-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] rounded-xl placeholder:text-gray-400"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="text-[14px] font-semibold text-gray-800 mb-3">Summary</h4>
                <div className="text-[13px] text-gray-600 mb-4">
                  <span className="font-semibold text-[#0052CC] text-xl mr-2">{selectedTests.length}</span>
                  tests selected
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1.5 pr-2">
                  {selectedTests.map(t => (
                    <div key={`summary-${t}`} className="text-[12px] text-gray-700 flex items-start gap-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC] mt-1.5 shrink-0" />
                      <span className="leading-tight">{t}</span>
                    </div>
                  ))}
                  {selectedTests.length === 0 && (
                    <div className="text-[12px] text-gray-400 italic">No tests selected yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
            <div className="text-[13px] text-gray-500">
              {selectedTests.length === 0 ? 'Please select at least one test' : 'Ready to submit request'}
            </div>
            <div className="flex gap-3">
              <button
                className="px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm"
                onClick={() => {
                  setLabTestDialog(false)
                  setLabSearch('')
                }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 text-[14px] font-medium text-white bg-[#0052CC] hover:bg-[#0047B3] disabled:opacity-50 disabled:hover:bg-[#0052CC] rounded-xl shadow-sm shadow-[#0052CC]/20 transition-all flex items-center gap-2"
                onClick={() => labTestMutation.mutate({ id, test_names: selectedTests, notes: labNotes })}
                disabled={selectedTests.length === 0 || labTestMutation.isPending}
              >
                {labTestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Request
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent className="p-0 shadow-2xl rounded-2xl font-sans overflow-hidden max-w-2xl bg-white/50 backdrop-blur-2xl border border-white/60 sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0">
            <div>
              <DialogTitle className="text-[22px] font-semibold text-gray-800 leading-tight">Send to Doctor</DialogTitle>
              <DialogDescription className="text-[13px] text-gray-600 mt-1">Escalate this case to a doctor. This will flag it in the doctor's queue.</DialogDescription>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-700 text-[13px] font-bold backdrop-blur-sm border border-orange-500/10">1</span>
                Escalation Details
              </div>
              <div className="ml-8">
                <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Reason for escalation</label>
                <Textarea
                  value={escalateNotes}
                  onChange={e => setEscalateNotes(e.target.value)}
                  placeholder="Explain why the doctor needs to review this case..."
                  className="min-h-[120px] text-[14px] resize-none border-black/15 bg-white/60 backdrop-blur-sm focus:border-orange-500 focus:bg-white/60 focus:ring-1 focus:ring-orange-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 shrink-0">
            <button
              className="px-5 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 bg-white/40 border border-white/50 rounded-lg transition-colors shadow-sm"
              onClick={() => setEscalateDialog(false)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-[14px] font-medium text-white bg-orange-500/90 hover:bg-orange-600 disabled:opacity-50 backdrop-blur-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
              onClick={() => escalateMutation.mutate({ id, notes: escalateNotes })}
            >
              Send to Doctor
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
