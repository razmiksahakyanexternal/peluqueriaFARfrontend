import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentResponse, CreateAppointmentRequest } from '../reservas-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  styleUrl: './peluquero.component.css'
})
export class PeluqueroComponent implements OnInit {

  users: any[] = [];
  selectedUserId: string | number = '';
  guestName: string = '';
  guestPhone: string = '';

  availableTimeSlots: string[] = [];
  bookingDate: string = '';
  bookingTime: string = '';

  showBookingModal = false;
  showCancelModal = false;

  appointmentToCancel: DayAppointment | null = null;

  isLoading = false;
  errorMessage = '';

  currentUser: any = null;

  dayAppointments: DayAppointment[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService
  ) {}

  ngOnInit(): void {
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

  // 🔥 NAV
  readonly navItems: AgendaNavItem[] = [
    { label: 'Agenda', active: true },
    { label: 'Configuracion horario' },
    { label: 'Historial' },
    { label: 'Clientes' }
  ];

  // 🔥 KPI
  get kpis(): AgendaKpi[] {
    return [
      {
        title: 'Citas de Hoy',
        value: this.totalClients.toString(),
        hint: `${this.occupiedSlots} bloques activos`
      },
      {
        title: 'Citas Pendientes',
        value: '0',
        hint: 'Pendientes de confirmar'
      },
      {
        title: 'Dias Laborables',
        value: 'Lun - Vie',
        hint: 'Configurar horario'
      }
    ];
  }

  // 🔥 CALENDARIO
  readonly weekDays: WeekDay[] = [
    { name: 'Lunes', date: '15' },
    { name: 'Martes', date: '16' },
    { name: 'Miercoles', date: '17' },
    { name: 'Jueves', date: '18', selected: true },
    { name: 'Viernes', date: '19' },
    { name: 'Sabado', date: '20', weekend: true },
    { name: 'Domingo', date: '21', weekend: true }
  ];

  readonly calendarEvents: CalendarEvent[] = [];

  // 🔥 FIX ERROR: formattedToday
  get formattedToday(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // 🔥 STATS
  get occupiedSlots(): number {
    return this.dayAppointments.length;
  }

  get totalClients(): number {
    return this.dayAppointments.filter(a => a.name !== '--').length;
  }

  get upcomingAppointments(): DayAppointment[] {
    return this.dayAppointments.filter(a => a.name !== '--');
  }

  get nextAppointment(): DayAppointment | null {
    return this.upcomingAppointments[0] ?? null;
  }

  // 🔥 SAFE INITIALS
  initials(name: string): string {
    if (!name || name === '--') return '-';

    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  // 🔥 MODAL CONTROL
  openBookingModal(): void {
    this.showBookingModal = true;
    this.errorMessage = '';
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

  openCancelModal(app: DayAppointment): void {
    this.appointmentToCancel = app;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.appointmentToCancel = null;
    this.showCancelModal = false;
  }

  // 🔥 BOOKING
  onBookingDateChange(): void {
    const token = this.authService.getToken();

    if (!token || !this.bookingDate) {
      this.availableTimeSlots = this.getTimeSlots();
      return;
    }

    this.reservasApiService.getOccupiedSlots(this.bookingDate, token).subscribe({
      next: (occupied: string[]) => {
        const all = this.getTimeSlots();
        this.availableTimeSlots = all.filter(slot =>
          !occupied.includes(slot + ':00')
        );
      },
      error: () => {
        this.availableTimeSlots = this.getTimeSlots();
      }
    });
  }

  bookAppointment(): void {
    if (!this.bookingDate || !this.bookingTime || !this.guestName) {
      this.errorMessage = 'Completa los campos obligatorios';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    const request: CreateAppointmentRequest = {
      appointmentDate: this.bookingDate,
      startTime: this.bookingTime + ':00',
      guestName: this.guestName,
      guestPhone: this.guestPhone
    };

    this.isLoading = true;

    this.reservasApiService.createAppointment(request, token).subscribe({
      next: () => {
        this.closeBookingModal();
        this.loadAppointments();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al crear la cita';
        this.isLoading = false;
      }
    });
  }

  confirmCancelAppointment(): void {
    if (!this.appointmentToCancel) return;

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.isLoading = true;

    this.reservasApiService
      .deleteAppointment(this.appointmentToCancel.id, token)
      .subscribe({
        next: () => {
          this.closeCancelModal();
          this.loadAppointments();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Error al cancelar la cita';
          this.isLoading = false;
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }

  // 🔥 LOAD DATA
  private loadAppointments(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    this.isLoading = true;

    this.reservasApiService
      .getAppointmentsInRange(today, today, token)
      .subscribe({
        next: (appointments: AppointmentResponse[]) => {
          this.dayAppointments = appointments.map(a => ({
            id: a.id,
            time: a.startTime.substring(0, 5),
            name: a.guestName || 'Sin nombre'
          }));
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Error al cargar citas';
          this.isLoading = false;
        }
      });
  }

  private loadUsers(): void {
    this.users = [
      { id: 1, name: 'Ana', surname: 'Lopez' },
      { id: 2, name: 'Carlos', surname: 'Ruiz' },
      { id: 3, name: 'Maria', surname: 'Garcia' }
    ];
  }

  // 🔥 TIME SLOTS
  getTimeSlots(): string[] {
    return [
      '09:00','09:15','09:30','09:45',
      '10:00','10:15','10:30','10:45',
      '11:00','11:15','11:30','11:45',
      '12:00','12:15','12:30','12:45',
      '13:00','13:15','13:30','13:45',
      '14:00','14:15','14:30','14:45',
      '15:00','15:15','15:30','15:45',
      '16:00','16:15','16:30','16:45',
      '17:00','17:15','17:30','17:45',
      '18:00'
    ];
  }
}