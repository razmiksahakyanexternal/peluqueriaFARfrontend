import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentItem } from '../reservas-api.service';

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css',
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class MisCitasComponent implements OnInit {
  appointments: AppointmentItem[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private reservasApiService: ReservasApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.loadMyAppointments();
  }

  loadMyAppointments(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'No autenticado';
      return;
    }

    this.loading = true;
    this.reservasApiService.getMyAppointments(token).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.errorMessage = 'Error al cargar citas';
        this.loading = false;
      }
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
}
