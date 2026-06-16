import { useAuthStore } from '../store/authStore'

export function useRole() {
  const { user } = useAuthStore()
  const role = user?.role

  return {
    isNurse: role === 'nurse',
    isDoctor: role === 'doctor',
    isLab: role === 'lab_technician',
    isAdmin: role === 'admin',
    role
  }
}
