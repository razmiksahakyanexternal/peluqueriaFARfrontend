import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

interface AgendaNavItem {
  label: string;
  active?: boolean;
}

interface AgendaKpi {
  title: string;
  value: string;
  hint: string;
}

interface WeekDay {
  name: string;
  date: string;
  weekend?: boolean;
  selected?: boolean;
}

interface CalendarEvent {
  day: number;
  start: number;
  span: number;
  title: string;
  variant: 'cita' | 'libre' | 'cerrado';
}

interface DayAppointment {
  time: string;
  name: string;
  status?: 'none' | 'blocked';
}

@Component({
  selector: 'app-peluquero',
  templateUrl: './peluquero.component.html',
  styleUrl: './peluquero.component.css',
  standalone: false
})
export class PeluqueroComponent {
  constructor(private authService: AuthService, private router: Router) {}

  readonly navItems: AgendaNavItem[] = [
    { label: 'Agenda', active: true },
    { label: 'Configuracion horario' },
    { label: 'Historial' },
    { label: 'Clientes' }
  ];

  readonly kpis: AgendaKpi[] = [
    { title: 'Citas de Hoy', value: '8', hint: '3 bloques activos' },
    { title: 'Citas Pendientes', value: '2', hint: 'Pendientes de confirmar' },
    { title: 'Dias Laborables', value: 'Lun - Vie', hint: 'Configurar horario' }
  ];

  readonly weekDays: WeekDay[] = [
    { name: 'Lunes', date: '15' },
    { name: 'Martes', date: '16' },
    { name: 'Miercoles', date: '17' },
    { name: 'Jueves', date: '18', selected: true },
    { name: 'Viernes', date: '19' },
    { name: 'Sabado', date: '20', weekend: true },
    { name: 'Domingo', date: '21', weekend: true }
  ];

  readonly timeSlots: string[] = [
    '09:00',
    '09:15',
    '09:30',
    '09:45',
    '10:00',
    '10:15',
    '10:30',
    '10:45',
    '11:00',
    '11:15',
    '11:30',
    '11:45'
  ];

  readonly calendarEvents: CalendarEvent[] = [
    { day: 0, start: 1, span: 2, title: 'Ana Lopez', variant: 'cita' },
    { day: 0, start: 3, span: 1, title: 'Carlos Ruiz', variant: 'cita' },
    { day: 0, start: 5, span: 2, title: 'Pablo Gomez', variant: 'cita' },
    { day: 1, start: 2, span: 5, title: 'Dia libre', variant: 'libre' },
    { day: 2, start: 3, span: 2, title: 'Carlos Diaz', variant: 'cita' },
    { day: 2, start: 6, span: 1, title: 'Permites', variant: 'cita' },
    { day: 2, start: 9, span: 2, title: 'Javier Diaz', variant: 'cita' },
    { day: 3, start: 1, span: 2, title: 'Pena Ramire', variant: 'cita' },
    { day: 3, start: 3, span: 2, title: '90 min', variant: 'cita' },
    { day: 3, start: 6, span: 2, title: 'Elena Tides', variant: 'cita' },
    { day: 3, start: 8, span: 2, title: 'BAJOE DIA', variant: 'cerrado' },
    { day: 4, start: 1, span: 2, title: 'Pio Ramos', variant: 'cita' },
    { day: 4, start: 4, span: 2, title: 'Javier Sote', variant: 'cita' },
    { day: 4, start: 7, span: 2, title: 'Jose Bando', variant: 'cita' }
  ];

  readonly dayAppointments: DayAppointment[] = [
    { time: '09:00', name: 'Ana Lopez' },
    { time: '10:00', name: '--', status: 'blocked' },
    { time: '10:15', name: 'Diego Costa' },
    { time: '11:15', name: 'Ferna Carriba' }
  ];

  get occupiedSlots(): number {
    return this.calendarEvents
      .filter((event) => event.variant === 'cita')
      .reduce((total, event) => total + event.span, 0);
  }

  get totalClients(): number {
    return this.dayAppointments.filter((appointment) => appointment.name !== '--').length;
  }

  get occupancyPercent(): number {
    const total = this.timeSlots.length;
    return Math.round((this.occupiedSlots / total) * 100);
  }

  get formattedToday(): string {
    return 'Jueves, 18 Abril 2024';
  }

  get upcomingAppointments(): DayAppointment[] {
    return this.dayAppointments.filter((appointment) => appointment.name !== '--');
  }

  get nextAppointment(): DayAppointment | null {
    return this.upcomingAppointments[0] ?? null;
  }

  trackByTime(_: number, appointment: DayAppointment): string {
    return `${appointment.time}-${appointment.name}`;
  }

  trackByLabel(_: number, item: AgendaNavItem): string {
    return item.label;
  }

  trackByKpi(_: number, item: AgendaKpi): string {
    return item.title;
  }

  trackBySlot(_: number, slot: string): string {
    return slot;
  }

  trackByDay(_: number, day: WeekDay): string {
    return `${day.name}-${day.date}`;
  }

  trackByEvent(_: number, event: CalendarEvent): string {
    return `${event.day}-${event.start}-${event.title}`;
  }

  initials(name: string): string {
    if (name === '--') {
      return '-';
    }

    const parts = name.split(' ');
    return `${parts[0].charAt(0)}${parts[1] ? parts[1].charAt(0) : ''}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }
}
