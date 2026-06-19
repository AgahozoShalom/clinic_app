import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStudentById, getStudentMedicalHistory } from '@/api/students.api'
import { StatusPill } from '@/components/shared/StatusPill'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeft, UserCircle, ClipboardList, AlertTriangle, Stethoscope, Mail, Phone, Calendar, Hash } from 'lucide-react'
import { formatRelative } from '@/utils/formatDate'

export function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: student, isLoading: load1 } = useQuery({ queryKey: ['student', id], queryFn: () => getStudentById(id) })
  const { data: history, isLoading: load2 } = useQuery({ queryKey: ['student', id, 'history'], queryFn: () => getStudentMedicalHistory(id) })

  if (load1 || load2) return <div className="p-8 text-center text-gray-500 font-sans">Loading student profile...</div>
  if (!student) return <div className="p-8 text-center text-red-500 font-sans">Student not found.</div>

  const hasAllergies = student.allergies && student.allergies.length > 0
  const hasConditions = student.chronic_conditions && student.chronic_conditions.length > 0

  return (
    <div className="space-y-6 max-w-[1400px] w-full p-4 sm:p-6 lg:p-8 font-sans mx-auto">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Student Profile</h1>
          <p className="text-gray-500 mt-1 text-[14px]">View student demographics and complete medical history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100/80 p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-50 text-[#0052CC] rounded-full flex items-center justify-center mb-5">
              <UserCircle className="w-14 h-14" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-800 leading-tight">{student.full_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[13px] font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{student.admission_code}</span>
              <span className="text-[13px] font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{student.grade} {student.class}</span>
            </div>

            <div className="w-full mt-8 border-t border-gray-100 pt-6 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <UserCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Age & Gender</div>
                  <div className="text-[14px] text-gray-800 font-medium">{student.age} yrs • {student.gender}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Date of Birth</div>
                  <div className="text-[14px] text-gray-800 font-medium">{new Date(student.dob).toLocaleDateString('en-GB')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Family Name</div>
                  <div className="text-[14px] text-gray-800 font-medium">{student.family_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Mother's Contact</div>
                  <div className="text-[14px] text-gray-800 font-medium">{student.mother_phone || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Alerts Card */}
          {(hasAllergies || hasConditions) && (
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-4 text-[14px]">
                <AlertTriangle className="w-4 h-4" /> Critical Medical Alerts
              </h3>
              
              {hasAllergies && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700/70 block mb-2">Known Allergies</span>
                  <div className="flex flex-wrap gap-2">
                    {student.allergies.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-red-200 rounded-md text-[13px] font-medium text-red-700 shadow-sm">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {hasConditions && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700/70 block mb-2">Chronic Conditions</span>
                  <div className="flex flex-col gap-1.5">
                    {student.chronic_conditions.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] font-medium text-red-800 bg-red-50/50 p-2 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Clinic History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100/80 overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="p-5 border-b border-gray-100 bg-[#F8FAFC]">
              <h3 className="text-[15px] font-medium text-gray-800">Clinic Visit History</h3>
            </div>

            <div className="flex-1 p-0">
              {!history?.length ? (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-gray-800 font-medium mb-1">No visit history</h3>
                  <p className="text-[14px] text-gray-500">This student has not visited the clinic yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {history.map(c => (
                    <div key={c.case_id || c.id} className="p-6 hover:bg-gray-50/50 transition-colors flex gap-5 group">
                      <div className="mt-0.5 bg-blue-50 p-2.5 rounded-full h-11 w-11 flex items-center justify-center text-[#0052CC] shrink-0 border border-blue-100/50">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => navigate(`/cases/${c.case_id || c.id}`)}
                              className="font-semibold text-gray-800 text-[15px] hover:text-[#0052CC] hover:underline underline-offset-2 transition-colors"
                            >
                              Case #{c.case_id || c.id}
                            </button>
                            <StatusPill status={c.status} className="scale-90 origin-left" />
                          </div>
                          <span className="text-[13px] text-gray-400 font-medium">{formatRelative(c.created_at)}</span>
                        </div>
                        
                        <div className="text-[14px] text-gray-700 bg-[#F8FAFC] p-4 rounded-xl border border-gray-100 mt-3 mb-4 leading-relaxed">
                          <span className="font-semibold text-gray-600 block mb-1 text-[12px] uppercase tracking-wide">Chief Complaint</span>
                          {c.complaint}
                        </div>
                        
                        {c.nurse_notes && (
                          <div className="text-[14px] text-gray-700 mb-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm leading-relaxed">
                            <span className="font-semibold text-gray-600 block mb-1 text-[12px] uppercase tracking-wide">Nurse Notes</span>
                            <span className="whitespace-pre-wrap">{c.nurse_notes}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-[12px] font-medium mt-2">
                          {c.severity && (
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1.5">
                              <span className="text-gray-400">Severity:</span> <span className="uppercase">{c.severity}</span>
                            </span>
                          )}
                          {c.temperature && (
                            <span className="bg-orange-50 text-orange-800 px-2.5 py-1 rounded-md border border-orange-100 flex items-center gap-1.5">
                              <span className="text-orange-500/70">Temp:</span> {c.temperature}°C
                            </span>
                          )}
                          {c.blood_pressure && (
                            <span className="bg-red-50 text-red-800 px-2.5 py-1 rounded-md border border-red-100 flex items-center gap-1.5">
                              <span className="text-red-500/70">BP:</span> {c.blood_pressure}
                            </span>
                          )}
                          {c.heart_rate && (
                            <span className="bg-pink-50 text-pink-800 px-2.5 py-1 rounded-md border border-pink-100 flex items-center gap-1.5">
                              <span className="text-pink-500/70">HR:</span> {c.heart_rate} bpm
                            </span>
                          )}
                          {c.respiratory_rate && (
                            <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
                              <span className="text-blue-500/70">Resp:</span> {c.respiratory_rate}/min
                            </span>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            <span className="font-medium text-gray-600">Opened by:</span> {c.opened_by}
                          </span>
                          {c.closed_by_name && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              <span className="font-medium text-gray-600">Closed by:</span> {c.closed_by_name} <span className="text-gray-400 ml-1">({formatRelative(c.closed_at)})</span>
                            </span>
                          )}
                        </div>
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
