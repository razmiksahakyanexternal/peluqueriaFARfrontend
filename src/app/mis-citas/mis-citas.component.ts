import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { AppointmentResponse, ReservasApiService } from '../reservas-api.service';

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css',
  standalone: false
})
export class MisCitasComponent implements OnInit {
  appointments: AppointmentResponse[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  deletingAppointmentId: number | null = null;
  confirmAppointmentId: number | null = null;

  constructor(
    private authService: AuthService,
    private reservasApiService: ReservasApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.loadAppointments(token);
  }

  cancelarCita(appointmentId: number): void {
    const token = this.authService.getToken();
    if (!token || this.deletingAppointmentId !== null) {
      return;
    }

    this.confirmAppointmentId = appointmentId;
  }

  cerrarModalCancelacion(): void {
    if (this.deletingAppointmentId !== null) {
      return;
    }

    this.confirmAppointmentId = null;
  }

  confirmarCancelacion(): void {
    const token = this.authService.getToken();
    const appointmentId = this.confirmAppointmentId;
    if (!token || appointmentId === null || this.deletingAppointmentId !== null) {
      return;
    }

    this.deletingAppointmentId = appointmentId;
    this.errorMessage = null;
    this.successMessage = null;

    this.reservasApiService.deleteAppointment(appointmentId, token).subscribe({
      next: () => {
        this.appointments = this.appointments.filter(appointment => appointment.id !== appointmentId);
        this.successMessage = 'Cita cancelada correctamente.';
        this.deletingAppointmentId = null;
        this.confirmAppointmentId = null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudo cancelar la cita.';
        this.deletingAppointmentId = null;
        this.cdr.detectChanges();
      },
    });
  }

  isDeletingAppointment(appointmentId: number): boolean {
    return this.deletingAppointmentId === appointmentId;
  }

  private loadAppointments(token: string): void {
    this.reservasApiService.getMyAppointments(token).subscribe({
      next: (appointments) => {
        this.appointments = this.normalizeAppointments(appointments);
        this.errorMessage = null;
        this.successMessage = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.appointments = [];
        this.errorMessage = 'No se pudieron cargar tus citas.';
        this.successMessage = null;
        this.cdr.detectChanges();
      },
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  formatAppointmentDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[date.getDay()]} ${day} de ${months[month - 1]} de ${year}`;
  }

  private normalizeAppointments(value: AppointmentResponse[] | Record<string, AppointmentResponse> | null | undefined): AppointmentResponse[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === 'object') {
      return Object.values(value);
    }

    return [];
  }
}
