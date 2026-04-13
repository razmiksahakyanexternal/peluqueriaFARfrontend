import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsLocalService, StoredAppointment } from '../appointments-local.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css',
  standalone: false
})
export class MisCitasComponent implements OnInit {
  appointments: StoredAppointment[] = [];

  constructor(
    private authService: AuthService,
    private appointmentsLocalService: AppointmentsLocalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.appointments = this.appointmentsLocalService.getMyAppointments();
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
