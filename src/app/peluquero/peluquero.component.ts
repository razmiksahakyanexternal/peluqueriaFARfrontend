import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  standalone: false
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

  weekDays: WeekDay[] = [];

  readonly dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
    this.weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name: this.dayNames[date.getDay()],
        date: date.getDate().toString(),
        iso: this.toIsoDate(date),
        weekend: date.getDay() === 0 || date.getDay() === 6,
        selected: this.isSameDay(date, this.selectedDate)
      };
    });
  }

  get appointmentsThisDay(): AppointmentItem[] {
    const todayIso = this.toIsoDate(this.selectedDate);
    return this.appointments
      .filter((appointment) => appointment.appointmentDate === todayIso)
      .sort(this.sortAppointments);
  }

  get appointmentsThisWeek(): AppointmentItem[] {
    const dates = new Set(this.weekDays.map((day) => day.iso));
    return this.appointments
      .filter((appointment) => dates.has(appointment.appointmentDate))
      .sort(this.sortAppointments);
  }

  get appointmentsThisMonth(): AppointmentItem[] {
    const month = this.selectedDate.getMonth();
    const year = this.selectedDate.getFullYear();
    return this.appointments
      .filter((appointment) => {
        const date = new Date(appointment.appointmentDate);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .sort(this.sortAppointments);
  }

  get calendarEvents(): CalendarEvent[] {
    if (this.viewMode === 'month') {
      return [];
    }

    return this.appointmentsThisWeek.map((appointment) => {
      const dayIndex = this.weekDays.findIndex((day) => day.iso === appointment.appointmentDate);
      const startIndex = this.timeSlots.indexOf(appointment.startTime);
      return {
        day: dayIndex >= 0 ? dayIndex : 0,
        start: startIndex >= 0 ? startIndex + 1 : 1,
        span: 1,
        title: appointment.guestName ?? 'Reserva',
        variant: 'cita'
      };
    });
  }

  get dayCalendarEvents(): CalendarEvent[] {
    return this.appointmentsThisDay.map((appointment) => {
      const startIndex = this.timeSlots.indexOf(appointment.startTime);
      return {
        day: 0,
        start: startIndex >= 0 ? startIndex + 1 : 1,
        span: 1,
        title: appointment.guestName ?? 'Reserva',
        variant: 'cita'
      };
    });
  }

  get monthDays(): MonthDay[] {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days: MonthDay[] = [];
    const today = new Date();
    const selectedIso = this.toIsoDate(this.selectedDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const iso = this.toIsoDate(date);
      const appointments = this.appointments.filter(apt => apt.appointmentDate === iso);

      days.push({
        date: date.getDate(),
        iso,
        currentMonth: date.getMonth() === month,
        today: date.toDateString() === today.toDateString(),
        selected: iso === selectedIso,
        appointments
      });
    }

    return days;
  }

  get periodTitle(): string {
    if (this.viewMode === 'month') {
      return `${this.monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
    }
    if (this.viewMode === 'day') {
      return this.formatFullDate(this.selectedDate);
    }
    const first = new Date(this.weekDays[0].iso);
    const last = new Date(this.weekDays[6].iso);
    return `Semana del ${first.getDate()} - ${last.getDate()} ${this.monthNames[first.getMonth()]} ${first.getFullYear()}`;
  }

  get formattedToday(): string {
    return this.formatFullDate(this.selectedDate);
  }

  get nextAppointment(): AppointmentItem | null {
    return this.appointmentsThisDay[0] ?? null;
  }

  get visibleAppointments(): AppointmentItem[] {
    if (this.viewMode === 'month') {
      return this.appointmentsThisMonth;
    }
    if (this.viewMode === 'day') {
      return this.appointmentsThisDay;
    }
    return this.appointmentsThisWeek;
  }

  get kpiValues(): AgendaKpi[] {
    return [
      { title: 'Citas de Hoy', value: String(this.appointmentsThisDay.length), hint: 'Reservas activas' },
      { title: 'Citas Esta Semana', value: String(this.appointmentsThisWeek.length), hint: 'Resumen semanal' },
      { title: 'Citas Este Mes', value: String(this.appointmentsThisMonth.length), hint: 'Vista mensual' }
    ];
  }

  get monthlyGroups(): { label: string; appointments: AppointmentItem[] }[] {
    const groups = new Map<string, AppointmentItem[]>();
    this.appointmentsThisMonth.forEach((appointment) => {
      const key = appointment.appointmentDate;
      groups.set(key, [...(groups.get(key) ?? []), appointment]);
    });
    return Array.from(groups.entries()).map(([date, appointments]) => ({
      label: this.formatShortDate(new Date(date)),
      appointments: appointments.sort(this.sortAppointments)
    }));
  }

  private loadAppointments(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.appointments = [];
      return;
    }

    const [start, end] = this.getRangeDates();
    this.reservasApiService.getAppointmentsInRange(start, end, token).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.appointments = [];
      }
    });
  }

  private getRangeDates(): [string, string] {
    if (this.viewMode === 'month') {
      const startDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
      const endDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);
      return [this.toIsoDate(startDate), this.toIsoDate(endDate)];
    }

    const startDate = new Date(this.weekDays[0].iso);
    const endDate = new Date(this.weekDays[6].iso);
    return [this.toIsoDate(startDate), this.toIsoDate(endDate)];
  }

  private sortAppointments = (left: AppointmentItem, right: AppointmentItem): number => {
    if (left.appointmentDate !== right.appointmentDate) {
      return left.appointmentDate.localeCompare(right.appointmentDate);
    }
    return left.startTime.localeCompare(right.startTime);
  };

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private getMonday(date: Date): Date {
    const current = new Date(date);
    const day = current.getDay();
    const diff = (day + 6) % 7;
    current.setDate(current.getDate() - diff);
    return current;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatFullDate(date: Date): string {
    const dayName = this.dayNames[date.getDay()];
    const monthName = this.monthNames[date.getMonth()];
    return `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
  }

  private formatShortDate(date: Date): string {
    const day = date.getDate();
    const monthName = this.monthNames[date.getMonth()];
    return `${day} ${monthName}`;
  }

  trackByLabel = (_: number, item: { label: string }) => item.label;
  trackByKpi = (_: number, kpi: AgendaKpi) => kpi.title;
  trackByDay = (_: number, day: WeekDay) => day.iso;
  trackByMonthDay = (_: number, day: MonthDay) => day.iso;
  trackBySlot = (_: number, slot: string) => slot;
  trackByEvent = (_: number, event: CalendarEvent) => `${event.day}-${event.start}`;
  trackByTime = (_: number, appointment: AppointmentItem) => appointment.id;

  initials(name: string | undefined): string {
    if (!name || name === '--') {
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
