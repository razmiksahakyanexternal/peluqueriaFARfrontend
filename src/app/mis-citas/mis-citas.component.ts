import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
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
  errorMessage: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
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
}
