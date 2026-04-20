import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsLocalService, StoredAppointment } from '../appointments-local.service';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentItem } from '../reservas-api.service';

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css',
  standalone: false
})
export class MisCitasComponent implements OnInit {
  appointments: AppointmentItem[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  confirmCancelAppointmentId: number | null = null;

  constructor(
    private authService: AuthService,
    private appointmentsLocalService: AppointmentsLocalService,
    private reservasApiService: ReservasApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const token = this.authService.getToken();
    if (!token) {
      this.loading = false;
      this.errorMessage = 'Debes iniciar sesión para ver tus citas.';
      return;
    }

    this.reservasApiService.getMyAppointments(token).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudieron cargar tus citas. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  formatAppointmentDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[date.getDay()]} ${day} de ${months[month - 1]} de ${year}`;
  }

  formatTime(time: string): string {
    return time.endsWith(':00') ? time.slice(0, -3) : time;
  }

  isFutureAppointment(appointment: AppointmentItem): boolean {
    const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.startTime);
    const now = new Date();
    return appointmentDate > now;
  }

  requestCancelAppointment(appointment: AppointmentItem): void {
    this.confirmCancelAppointmentId = appointment.id;
    this.errorMessage = null;
    this.successMessage = null;
  }

  abortCancel(): void {
    this.confirmCancelAppointmentId = null;
  }

  confirmCancelAppointment(appointment: AppointmentItem): void {
    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Debes iniciar sesión para cancelar citas.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.reservasApiService.cancelAppointment(appointment.id, token).subscribe({
      next: () => {
        this.successMessage = 'Cita cancelada exitosamente.';
        this.confirmCancelAppointmentId = null;
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error al cancelar cita:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo cancelar la cita. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}

<<<<<<< Updated upstream
  cancelAppointment(appointment: StoredAppointment): void {
    if (!confirm(`¿Estás seguro de que deseas cancelar la cita del ${this.formatAppointmentDate(appointment.appointmentDate)} a las ${appointment.startTime}?`)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    const token = this.authService.getToken();

    // Cancela localmente inmediatamente
    try {
      this.appointmentsLocalService.cancelAppointment(appointment.id);
      this.appointments = this.appointmentsLocalService.getMyAppointments();
      this.successMessage = 'Cita cancelada correctamente.';
    } catch (error) {
      console.error('Error al cancelar localmente:', error);
      this.errorMessage = 'Error al cancelar la cita.';
      this.isLoading = false;
      return;
    }

    // Intenta también cancelar en el backend
    if (token) {
      this.reservasApiService.cancelAppointment(appointment.id, token).subscribe({
        next: () => {
          console.log('Cita cancelada en el backend');
          this.isLoading = false;
        },
        error: (error) => {
          // El error se loguea pero no importa, ya se canceló localmente
          console.warn('No se pudo cancelar en el backend, pero se canceló localmente:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
=======
  isFutureAppointment(appointment: AppointmentItem): boolean {
    const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.startTime);
    const now = new Date();
    return appointmentDate > now;
  }

  formatTime(time: string): string {
    return time.endsWith(':00') ? time.slice(0, -3) : time;
  }

  requestCancelAppointment(appointment: AppointmentItem): void {
    this.confirmCancelAppointmentId = appointment.id;
    this.errorMessage = null;
    this.successMessage = null;
  }

  abortCancel(): void {
    this.confirmCancelAppointmentId = null;
  }

  confirmCancelAppointment(appointment: AppointmentItem): void {
    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Debes iniciar sesión para cancelar citas.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.reservasApiService.cancelAppointment(appointment.id, token).subscribe({
      next: () => {
        this.successMessage = 'Cita cancelada exitosamente.';
        this.confirmCancelAppointmentId = null;
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error al cancelar cita:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo cancelar la cita. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
>>>>>>> Stashed changes
  }
}
