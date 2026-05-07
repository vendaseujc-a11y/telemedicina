export type UserRole = 'medico' | 'paciente';

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
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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