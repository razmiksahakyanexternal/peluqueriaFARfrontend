import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentItem, UserItem } from '../reservas-api.service';

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

interface DayAppointment {
  time: string;
  name: string;
  status?: 'none' | 'blocked';
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
  users: UserItem[] = [];
  showBookingModal = false;

  // Booking form
  bookingDate = '';
  bookingTime = '';
  selectedUserId: number | null = null;
  guestName = '';
  guestPhone = '';

  weekDays: WeekDay[] = [];
  timeSlots: string[] = [
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45'
  ];

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

  ngOnInit(): void {
    this.buildWeekDays();
    this.loadAppointments();
    this.loadUsers();
  }

  private buildWeekDays(): void {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    this.weekDays = [];
    const startOfWeek = new Date(this.selectedDate);
    startOfWeek.setDate(this.selectedDate.getDate() - this.selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push({
        name: days[date.getDay()],
        date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        iso: this.toIsoDate(date),
        weekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get dayAppointments(): DayAppointment[] {
    // For day view, return appointments for selected date
    return [];
  }

  get occupiedSlots(): number {
    return this.calendarEvents.filter(event => event.variant === 'cita').length;
  }

  get totalClients(): number {
    return this.dayAppointments.filter(appointment => appointment.name !== '--').length;
  }

  get occupancyPercent(): number {
    const total = this.timeSlots.length;
    return Math.round((this.occupiedSlots / total) * 100);
  }

  get formattedToday(): string {
    return 'Jueves, 18 Abril 2024';
  }

  get upcomingAppointments(): DayAppointment[] {
    return this.dayAppointments.filter(appointment => appointment.name !== '--');
  }

  get nextAppointment(): DayAppointment | null {
    return this.upcomingAppointments[0] ?? null;
  }

  get appointmentsThisWeek(): AppointmentItem[] {
    return this.appointments;
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

  private loadAppointments(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.appointments = [];
      return;
    }

    const [start, end] = this.getRangeDates();
    this.reservasApiService.getAppointmentsInRange(start, end, token).subscribe({
      next: (appointments: AppointmentItem[]) => {
        this.appointments = appointments;
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.appointments = [];
      }
    });
  }

  private loadUsers(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.users = [];
      return;
    }

    this.reservasApiService.getUsers(token).subscribe({
      next: (users: UserItem[]) => {
        this.users = users;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.users = [];
      }
    });
  }

  openBookingModal(): void {
    this.showBookingModal = true;
    this.bookingDate = this.toIsoDate(this.selectedDate);
    this.bookingTime = '';
    this.selectedUserId = null;
    this.guestName = '';
    this.guestPhone = '';
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  bookAppointment(): void {
    if (!this.bookingDate || !this.bookingTime) {
      alert('Selecciona fecha y hora');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      alert('No autenticado');
      return;
    }

    const request = {
      appointmentDate: this.bookingDate,
      startTime: this.bookingTime + ':00', // Add seconds
      guestName: this.guestName,
      guestPhone: this.guestPhone,
      userId: this.selectedUserId
    };

    this.reservasApiService.createAppointment(request, token).subscribe({
      next: (response) => {
        alert('Cita reservada correctamente');
        this.closeBookingModal();
        this.loadAppointments(); // Reload appointments
      },
      error: (error) => {
        console.error('Error al reservar cita:', error);
        alert('Error al reservar cita: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  onUserSelect(userId: string): void {
    this.selectedUserId = userId ? parseInt(userId) : null;
    if (this.selectedUserId) {
      const user = this.users.find(u => u.id === this.selectedUserId);
      if (user) {
        this.guestName = `${user.name} ${user.surname}`;
        this.guestPhone = ''; // Could be added to User entity if needed
      }
    } else {
      this.guestName = '';
      this.guestPhone = '';
    }
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

  changeView(mode: 'day' | 'week' | 'month'): void {
    this.viewMode = mode;
    this.loadAppointments();
  }

  movePeriod(direction: 'prev' | 'next'): void {
    const days = this.viewMode === 'week' ? 7 : this.viewMode === 'month' ? 30 : 1;
    const multiplier = direction === 'next' ? 1 : -1;
    this.selectedDate = new Date(this.selectedDate.getTime() + days * 24 * 60 * 60 * 1000 * multiplier);
    this.buildWeekDays();
    this.loadAppointments();
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
