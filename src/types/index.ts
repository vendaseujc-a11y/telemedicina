export type UserRole = 'medico' | 'paciente';

export const CURRENT_YEAR = new Date().getFullYear();

export const MONTHS_CONFIG = [
  { value: 0, label: "Janeiro", days: 31 },
  { value: 1, label: "Fevereiro", days: 28 },
  { value: 2, label: "Março", days: 31 },
  { value: 3, label: "Abril", days: 30 },
  { value: 4, label: "Maio", days: 31 },
  { value: 5, label: "Junho", days: 30 },
  { value: 6, label: "Julho", days: 31 },
  { value: 7, label: "Agosto", days: 31 },
  { value: 8, label: "Setembro", days: 30 },
  { value: 9, label: "Outubro", days: 31 },
  { value: 10, label: "Novembro", days: 30 },
  { value: 11, label: "Dezembro", days: 31 },
];

export const TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  specialty?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  video_room_id?: string;
  notes?: string;
  patient_symptoms?: string;
  created_at: string;
  updated_at: string;
  doctor?: Profile;
  patient?: Profile;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  date: string;
  time_slots: string[];
  created_at: string;
}

export interface VideoRoom {
  id: string;
  appointment_id: string;
  room_url: string;
  token: string;
  expires_at: string;
  created_at: string;
}