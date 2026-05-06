import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
<<<<<<< Updated upstream
=======
import { ReservasApiService, AppointmentItem, UserItem } from '../reservas-api.service';
>>>>>>> Stashed changes

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
  standalone: true,
  imports: [FormsModule, CommonModule]
})
<<<<<<< Updated upstream
export class PeluqueroComponent {
  constructor(private authService: AuthService, private router: Router) {}
=======
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
  showBookingOptions = false;
  clientType: 'registered' | 'unregistered' | null = null;

  // Reserva
  bookingDate = '';
  bookingTime = '';
  selectedUserId: number | null = null;
  selectedUser: UserItem | null = null;
  guestName = '';
  guestPhone = '';

  // Busqueda con autocompletado
  userSearchQuery = '';
  userSuggestions: UserItem[] = [];
  showUserSuggestions = false;

  // Validacion
  submitted = false;
  dateError = '';
  timeError = '';
  guestNameError = '';

  get todayIso(): string {
    return this.toIsoDate(new Date());
  }
>>>>>>> Stashed changes

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

  readonly allTimeSlots: string[] = [
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45'
  ];

<<<<<<< Updated upstream
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
=======
  get timeSlots(): string[] {
    if (!this.bookingDate) {
      return this.allTimeSlots;
    }
    const occupiedSlots = this.appointments
      .filter(apt => apt.appointmentDate === this.bookingDate)
      .map(apt => apt.startTime.substring(0, 5));
    return this.allTimeSlots.filter(slot => !occupiedSlots.includes(slot));
  }

  weekDays: WeekDay[] = [];

  readonly dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit(): void {
    this.buildWeekDays();
    this.loadAppointments();
    this.loadUsers();
>>>>>>> Stashed changes
  }

  get totalClients(): number {
    return this.dayAppointments.filter((appointment) => appointment.name !== '--').length;
  }

<<<<<<< Updated upstream
  get occupancyPercent(): number {
    const total = this.timeSlots.length;
    return Math.round((this.occupiedSlots / total) * 100);
=======
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
      const startIndex = this.allTimeSlots.indexOf(appointment.startTime);
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
      const startIndex = this.allTimeSlots.indexOf(appointment.startTime);
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

    for (let i = 0; i < 42; i++) {
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  trackByKpi(_: number, item: AgendaKpi): string {
    return item.title;
  }

  trackBySlot(_: number, slot: string): string {
    return slot;
=======
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

  openRegisteredBooking(): void {
    this.clientType = 'registered';
    this.showBookingOptions = false;
    this.showBookingModal = true;
  }

  openUnregisteredBooking(): void {
    this.clientType = 'unregistered';
    this.showBookingOptions = false;
    this.showBookingModal = true;
  }

  openBookingModal(): void {
    this.showBookingOptions = true;
    this.showBookingModal = false;

    // reset básico
    this.bookingDate = this.toIsoDate(this.selectedDate);
    this.bookingTime = '';
    this.selectedUserId = null;
    this.selectedUser = null;
    this.guestName = '';
    this.guestPhone = '';

    this.userSearchQuery = '';
    this.userSuggestions = [];
    this.showUserSuggestions = false;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  bookAppointment(): void {
    this.submitted = true;
    this.dateError = '';
    this.timeError = '';
    this.guestNameError = '';

    let hasError = false;

    if (!this.bookingDate) {
      this.dateError = 'La fecha es obligatoria';
      hasError = true;
    } else if (this.bookingDate < this.todayIso) {
      this.dateError = 'No se puede seleccionar una fecha anterior a hoy';
      hasError = true;
    }

    if (!this.bookingTime) {
      this.timeError = 'La hora es obligatoria';
      hasError = true;
    }

    const userIdValue = this.selectedUserId;
    if (this.clientType === 'registered' && !this.selectedUserId) {
      this.guestNameError = 'Debes seleccionar un cliente registrado';
      hasError = true;
    }

    if (this.clientType === 'unregistered' && !this.guestName) {
      this.guestNameError = 'Debes introducir el nombre del cliente';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      alert('No autenticado');
      return;
    }

    const request = {
      appointmentDate: this.bookingDate,
      startTime: this.bookingTime + ':00',
      guestName: this.guestName,
      guestPhone: this.guestPhone,
      userId: this.selectedUserId
    };

    this.reservasApiService.createAppointment(request, token).subscribe({
      next: (response) => {
        this.closeBookingModal();
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error al reservar cita:', error);
      }
    });
  }

  onUserSelect(userId: string): void {
    this.selectedUserId = userId ? parseInt(userId) : null;
    if (this.selectedUserId) {
      const user = this.users.find(u => u.id === this.selectedUserId);
      if (user) {
        this.selectedUser = user;
        this.guestName = `${user.name} ${user.surname}`;
        this.guestPhone = '';
      }
    } else {
      this.selectedUser = null;
      this.guestName = '';
      this.guestPhone = '';
    }
  }

  onUserSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.userSearchQuery = query;
    if (query) {
      const token = this.authService.getToken();
      if (token) {
        this.reservasApiService.searchUsers(query, token).subscribe({
          next: (users: UserItem[]) => {
            this.userSuggestions = users;
            this.showUserSuggestions = users.length > 0;
          },
          error: () => {
            this.userSuggestions = [];
            this.showUserSuggestions = false;
          }
        });
      }
    } else {
      this.userSuggestions = [];
      this.showUserSuggestions = false;
    }
  }

  selectUser(user: UserItem): void {
    this.selectedUserId = user.id;
    this.selectedUser = user;
    this.userSearchQuery = user.email;
    this.guestName = `${user.name} ${user.surname}`;
    this.guestPhone = '';
    this.showUserSuggestions = false;
  }

  clearUser(): void {
    this.selectedUserId = null;
    this.selectedUser = null;
    this.userSearchQuery = '';
    this.guestName = '';
    this.guestPhone = '';
    this.showUserSuggestions = false;
  }

  onBlurUser(): void {
    setTimeout(() => {
      this.showUserSuggestions = false;
    }, 200);
  }

  onFocusUser(): void {
    if (this.userSearchQuery) {
      this.onUserSearch({ target: { value: this.userSearchQuery } } as any);
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
>>>>>>> Stashed changes
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
