import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentResponse, CreateAppointmentRequest } from '../reservas-api.service';

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
  id: number;
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
export class PeluqueroComponent implements OnInit {
  users: any[] = [];
  selectedUserId: string | number = '';
  guestName: string = '';
  guestPhone: string = '';
  availableTimeSlots: string[] = [];
  showBookingModal: boolean = false;
  bookingDate: string = '';
  bookingTime: string = '';
  showCancelModal: boolean = false;
  appointmentToCancel: DayAppointment | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService
  ) {}

  ngOnInit(): void {
    // Verificar que el usuario sea BARBER
    const role = this.authService.getRole();
    if (role !== 'BARBER') {
      this.router.navigate(['/home']);
      return;
    }

    this.currentUser = {
      name: this.authService.getName(),
      surname: this.authService.getSurname()
    };

    this.loadAppointments();
    this.loadUsers();
  }

  readonly navItems: AgendaNavItem[] = [
    { label: 'Agenda', active: true },
    { label: 'Configuracion horario' },
    { label: 'Historial' },
    { label: 'Clientes' }
  ];

  get kpis(): AgendaKpi[] {
    return [
      { title: 'Citas de Hoy', value: this.totalClients.toString(), hint: `${this.occupiedSlots} bloques activos` },
      { title: 'Citas Pendientes', value: '0', hint: 'Pendientes de confirmar' },
      { title: 'Dias Laborables', value: 'Lun - Vie', hint: 'Configurar horario' }
    ];
  }

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

  dayAppointments: DayAppointment[] = [];

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

  closeBookingModal(): void {
    this.guestName = '';
    this.guestPhone = '';
    this.selectedUserId = '';
    this.availableTimeSlots = [];
    this.bookingDate = '';
    this.bookingTime = '';
    this.showBookingModal = false;
    this.errorMessage = '';
  }

  openBookingModal(): void {
    this.showBookingModal = true;
    this.errorMessage = '';
  }

  onBookingDateChange(): void {
    const token = this.authService.getToken();
    if (!token || !this.bookingDate) {
      this.availableTimeSlots = this.getTimeSlots();
      return;
    }

    // Obtener franjas ocupadas para la fecha seleccionada
    this.reservasApiService.getOccupiedSlots(this.bookingDate, token).subscribe({
      next: (occupiedSlots: string[]) => {
        const allSlots = this.getTimeSlots();
        this.availableTimeSlots = allSlots.filter(slot => !occupiedSlots.includes(slot + ':00'));
      },
      error: (err) => {
        console.error('Error al obtener franjas ocupadas:', err);
        this.availableTimeSlots = this.getTimeSlots();
      }
    });
  }

  bookAppointment(): void {
    if (!this.bookingDate || !this.bookingTime || !this.guestName) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    const appointmentRequest: CreateAppointmentRequest = {
      appointmentDate: this.bookingDate,
      startTime: this.bookingTime + ':00', // Agregar segundos
      guestName: this.guestName,
      guestPhone: this.guestPhone
    };

    this.isLoading = true;
    this.reservasApiService.createAppointment(appointmentRequest, token).subscribe({
      next: (response) => {
        console.log('Cita creada:', response);
        this.closeBookingModal();
        this.loadAppointments(); // Recargar lista de citas
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al crear cita:', err);
        this.errorMessage = 'Error al crear la cita';
        this.isLoading = false;
      }
    });
  }

  onUserSelect(userId: string | number): void {
    this.selectedUserId = userId;
  }

  openCancelModal(appointment: DayAppointment): void {
    this.appointmentToCancel = appointment;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.appointmentToCancel = null;
    this.showCancelModal = false;
  }

  confirmCancelAppointment(): void {
    if (!this.appointmentToCancel) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.isLoading = true;
    this.reservasApiService.deleteAppointment(this.appointmentToCancel.id, token).subscribe({
      next: () => {
        console.log('Cita cancelada:', this.appointmentToCancel);
        this.closeCancelModal();
        this.loadAppointments(); // Recargar lista de citas
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cancelar cita:', err);
        this.errorMessage = 'Error al cancelar la cita';
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }

  private loadAppointments(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Obtener citas de hoy - usando rango de hoy
    const today = new Date().toISOString().split('T')[0];
    this.reservasApiService.getAppointmentsInRange(today, today, token).subscribe({
      next: (appointments: AppointmentResponse[]) => {
        this.dayAppointments = appointments.map(apt => ({
          id: apt.id,
          time: apt.startTime.substring(0, 5), // Convertir HH:mm:ss a HH:mm
          name: apt.guestName || 'Sin nombre'
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar citas:', err);
        this.errorMessage = 'Error al cargar las citas';
        this.isLoading = false;
      }
    });
  }

  private loadUsers(): void {
    // Por ahora, cargamos usuarios de ejemplo
    // En una implementación real, esto vendría del backend
    this.users = [
      { id: 1, name: 'Ana', surname: 'Lopez', email: 'ana@example.com' },
      { id: 2, name: 'Carlos', surname: 'Ruiz', email: 'carlos@example.com' },
      { id: 3, name: 'Maria', surname: 'Garcia', email: 'maria@example.com' }
    ];
  }

  private getTimeSlots(): string[] {
    return [
      '09:00', '09:15', '09:30', '09:45',
      '10:00', '10:15', '10:30', '10:45',
      '11:00', '11:15', '11:30', '11:45',
      '12:00', '12:15', '12:30', '12:45',
      '13:00', '13:15', '13:30', '13:45',
      '14:00', '14:15', '14:30', '14:45',
      '15:00', '15:15', '15:30', '15:45',
      '16:00', '16:15', '16:30', '16:45',
      '17:00', '17:15', '17:30', '17:45',
      '18:00'
    ];
  }
}
