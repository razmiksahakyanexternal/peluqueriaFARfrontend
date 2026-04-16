import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface StoredAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsLocalService {
  private readonly storagePrefix = 'peluqueria-far-appointments';

  constructor(private authService: AuthService) {}

  getMyAppointments(): StoredAppointment[] {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey(email));
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as StoredAppointment[];
    } catch {
      return [];
    }
  }

  saveAppointment(appointmentDate: string, startTime: string): StoredAppointment {
    const email = this.getCurrentUserEmail();
    if (!email) {
      throw new Error('No hay un usuario autenticado.');
    }

    const appointments = this.getMyAppointments();
    const alreadyExists = appointments.some(
      (appointment) => appointment.appointmentDate === appointmentDate && appointment.startTime === startTime
    );

    if (alreadyExists) {
      throw new Error('Ya tienes una cita reservada en esa fecha y hora.');
    }

    const newAppointment: StoredAppointment = {
      id: `${Date.now()}-${startTime}`,
      appointmentDate,
      startTime
    };

    const updatedAppointments = [newAppointment, ...appointments].sort((left, right) => {
      const leftKey = `${left.appointmentDate}T${left.startTime}`;
      const rightKey = `${right.appointmentDate}T${right.startTime}`;
      return rightKey.localeCompare(leftKey);
    });

    localStorage.setItem(this.storageKey(email), JSON.stringify(updatedAppointments));
    return newAppointment;
  }

  private storageKey(email: string): string {
    return `${this.storagePrefix}-${email}`;
  }

  cancelAppointment(appointmentId: string): void {
    const email = this.getCurrentUserEmail();
    if (!email) {
      throw new Error('No hay un usuario autenticado.');
    }

    let appointments = this.getMyAppointments();
    appointments = appointments.filter(app => app.id !== appointmentId);
    localStorage.setItem(this.storageKey(email), JSON.stringify(appointments));
  }

  private getCurrentUserEmail(): string | null {
    const token = this.authService.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
