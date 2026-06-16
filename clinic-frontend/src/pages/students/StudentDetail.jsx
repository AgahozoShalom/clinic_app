import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStudentById, getStudentMedicalHistory } from '@/api/students.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, User, ClipboardList, AlertTriangle } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'

export function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: student, isLoading: load1 } = useQuery({ queryKey: ['student', id], queryFn: () => getStudentById(id) })
  const { data: history, isLoading: load2 } = useQuery({ queryKey: ['student', id, 'history'], queryFn: () => getStudentMedicalHistory(id) })

  if (load1 || load2) return <div className="p-8 text-center text-text-muted">Loading student data...</div>
  if (!student) return <div className="p-8 text-center text-danger">Student not found.</div>

  const hasAllergies = student.allergies && student.allergies.length > 0
  const hasConditions = student.chronic_conditions && student.chronic_conditions.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          Student Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm text-center">
            <div className="mx-auto w-20 h-20 bg-brand-light text-brand rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">{student.full_name}</h2>
            <p className="text-text-muted">{student.admission_code}</p>
            
            <div className="mt-6 border-t border-border pt-4 grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Class</div>
                <div className="font-medium">{student.grade} {student.class}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Age/Gender</div>
                <div className="font-medium">{student.age} / {student.gender}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">DOB</div>
                <div className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">House</div>
                <div className="font-medium">{student.house || 'N/A'}</div>
              </div>
            </div>
            <div className="mt-4 text-left">
              <div className="text-xs text-text-muted uppercase tracking-wider">Parent Contact</div>
              <div className="font-medium">{student.parent_contact || 'N/A'}</div>
            </div>
          </div>

          {(hasAllergies || hasConditions) && (
            <div className="bg-danger-bg border border-danger/20 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-danger flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Medical Alerts
              </h3>
              {hasAllergies && (
                <div className="mb-3">
                  <span className="text-xs font-semibold uppercase text-danger/80 block mb-1">Allergies</span>
                  <div className="flex flex-wrap gap-2">
                    {student.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-white/50 border border-danger/30 rounded text-xs font-medium text-danger">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {hasConditions && (
                <div>
                  <span className="text-xs font-semibold uppercase text-danger/80 block mb-1">Chronic Conditions</span>
                  <ul className="list-disc list-inside text-sm text-danger/90">
                    {student.chronic_conditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border bg-[#FDFEFC] flex justify-between items-center">
              <h3 className="font-semibold text-text-primary">Clinic History</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {!history?.length ? (
                <EmptyState icon={ClipboardList} title="No history" description="This student hasn't visited the clinic yet." />
              ) : (
                <div className="divide-y divide-border">
                  {history.map(c => (
                    <div key={c.id} className="p-4 hover:bg-[#F0F5F2] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-brand cursor-pointer hover:underline" onClick={() => navigate(`/cases/${c.id}`)}>
                            Case #{c.id}
                          </span>
                          <StatusPill status={c.status} />
                        </div>
                        <span className="text-sm text-text-muted">{formatRelative(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-primary mt-1 line-clamp-2">
                        <span className="font-medium text-text-muted">Complaint: </span>
                        {c.complaint}
                      </p>
                      <div className="mt-3 flex gap-4 text-xs text-text-muted">
                        <span>Severity: {c.severity}</span>
                        <span>Opened by: {c.opened_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
