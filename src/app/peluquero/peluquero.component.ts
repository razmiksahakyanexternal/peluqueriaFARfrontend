import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentItem } from '../reservas-api.service';

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
  iso: string;
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

interface MonthDay {
  date: number;
  iso: string;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
  appointments: AppointmentItem[];
}

@Component({
  selector: 'app-peluquero',
  templateUrl: './peluquero.component.html',
  styleUrl: './peluquero.component.css',
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class PeluqueroComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService
  ) {}

  viewMode: 'day' | 'week' | 'month' = 'week';
  selectedDate = new Date();
  appointments: AppointmentItem[] = [];

  weekDays: WeekDay[] = [];

  readonly navItems: AgendaNavItem[] = [
    { label: 'Agenda', active: true },
    { label: 'Configuracion horario' },
    { label: 'Historial' },
    { label: 'Clientes' }
  ];

  readonly kpis: AgendaKpi[] = [
    { title: 'Citas de Hoy', value: '0', hint: 'Reservas activas' },
    { title: 'Citas Esta Semana', value: '0', hint: 'Resumen semanal' },
    { title: 'Citas Este Mes', value: '0', hint: 'Vista mensual' }
  ];

  readonly allTimeSlots: string[] = [
    '09:00','09:15','09:30','09:45',
    '10:00','10:15','10:30','10:45',
    '11:00','11:15','11:30','11:45'
  ];

  readonly dayNames = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];

  readonly monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  ngOnInit(): void {
    this.buildWeekDays();
    this.loadAppointments();
  }

  changeView(mode: 'day' | 'week' | 'month'): void {
    this.viewMode = mode;
    this.buildWeekDays();
    this.loadAppointments();
  }

  movePeriod(days: number): void {
    const nextDate = new Date(this.selectedDate);

    if (this.viewMode === 'month') {
      nextDate.setMonth(nextDate.getMonth() + days);
      nextDate.setDate(1);
    } else {
      nextDate.setDate(nextDate.getDate() + days);
    }

    this.selectedDate = nextDate;
    this.buildWeekDays();
    this.loadAppointments();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.buildWeekDays();
    this.loadAppointments();
  }

  buildWeekDays(): void {
    const monday = this.getMonday(this.selectedDate);

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      return {
        name: this.dayNames[date.getDay()],
        date: date.getDate().toString(),
        iso: this.toIsoDate(date),
        weekend: date.getDay() === 0 || date.getDay() === 6,
        selected: this.isSameDay(date, this.selectedDate)
      };
    });
  }

  get appointmentsThisWeek(): AppointmentItem[] {
    const dates = new Set(this.weekDays.map(d => d.iso));
    return this.appointments.filter(a => dates.has(a.appointmentDate));
  }

  get appointmentsThisDay(): AppointmentItem[] {
    const iso = this.toIsoDate(this.selectedDate);
    return this.appointments.filter(a => a.appointmentDate === iso);
  }

  get appointmentsThisMonth(): AppointmentItem[] {
    const m = this.selectedDate.getMonth();
    const y = this.selectedDate.getFullYear();

    return this.appointments.filter(a => {
      const d = new Date(a.appointmentDate);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }

  private loadAppointments(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const [start, end] = this.getRangeDates();

    this.reservasApiService.getAppointmentsInRange(start, end, token).subscribe({
      next: (data) => this.appointments = data,
      error: (err) => {
        console.error(err);
        this.appointments = [];
      }
    });
  }

  private getRangeDates(): [string, string] {
    if (this.viewMode === 'month') {
      const start = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
      const end = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);
      return [this.toIsoDate(start), this.toIsoDate(end)];
    }

    const start = new Date(this.weekDays[0].iso);
    const end = new Date(this.weekDays[6].iso);
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }
}