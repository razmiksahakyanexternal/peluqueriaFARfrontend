import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentResponse } from '../reservas-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DayAppointment {
  id: number;
  time: string;
  name: string;
  appointmentDate: string;
}

type AppointmentItem = {
  id: number;
  name: string;
};

@Component({
  selector: 'app-peluquero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peluquero.component.html',
  styleUrl: './peluquero.component.css'
})

export class PeluqueroComponent implements OnInit {

  viewMode: 'day' | 'week' | 'month' = 'week';

  currentUser: any = null;

  currentWeekOffset = 0;
  currentMonthOffset = 0;

  calendarDays: any[] = [];
  selectedDay: any = null;

  monthDays: any[] = [];

  dayAppointments: DayAppointment[] = [];
  appointmentsByDay: { [key: string]: DayAppointment[] } = {};

  timeSlots: string[] = [
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

  // =========================
  // MODAL RESERVA
  // =========================
  showBookingOptions = false;
  showBookingModal = false;
  clientType: 'registered' | 'unregistered' | null = null;

  bookingDate = '';
  bookingTime = '';
  guestName = '';
  guestPhone = '';
  selectedUserId: number | null = null;

  // usuarios
  users: any[] = [];
  userSearchQuery = '';
  userSuggestions: any[] = [];
  showUserSuggestions = false;
  selectedUser: any = null;

  submitted = false;
  dateError = '';
  timeError = '';
  guestNameError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.currentUser = {
      name: this.authService.getName(),
      surname: this.authService.getSurname()
    };

    this.updateCalendar();
    this.loadUsers();
  }

  // =========================
  // VIEW
  // =========================
  setView(mode: 'day' | 'week' | 'month') {

    this.viewMode = mode;

    if (mode === 'month') {
      this.buildMonth();
    } else {
      this.updateCalendar();
    }
  }

  // =========================
  // NAV SEMANA
  // =========================
  setWeek(offset: number) {

    this.currentWeekOffset = offset;

    this.updateCalendar();
  }

  nextWeek() {
    this.setWeek(this.currentWeekOffset + 1);
  }

  prevWeek() {
    this.setWeek(this.currentWeekOffset - 1);
  }

  // =========================
  // NAV MES
  // =========================
  nextMonth() {

    this.currentMonthOffset++;

    this.buildMonth();
  }

  prevMonth() {

    this.currentMonthOffset--;

    this.buildMonth();
  }

  // =========================
  // HOY
  // =========================
  goToday() {

    if (this.viewMode === 'month') {

      this.currentMonthOffset = 0;

      this.buildMonth();

    } else {

      this.setWeek(0);

    }
  }

  // =========================
  // FECHA LOCAL
  // =========================
  toLocalDate(date: Date): string {

    const offset = date.getTimezoneOffset();

    const local = new Date(date.getTime() - offset * 60000);

    return local.toISOString().split('T')[0];
  }

  // =========================
  // CALENDARIO SEMANA
  // =========================
  updateCalendar() {

    const today = new Date();

    today.setDate(
      today.getDate() + this.currentWeekOffset * 7
    );

    const start = new Date(today);

    start.setDate(
      today.getDate() - today.getDay()
    );

    const days = [
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb'
    ];

    const week: any[] = [];

    for (let i = 0; i < 7; i++) {

      const date = new Date(start);

      date.setDate(start.getDate() + i);

      week.push({
        name: days[date.getDay()],
        date: date.getDate(),
        iso: this.normalizeDate(
          this.toLocalDate(date)
        )
      });
    }

    this.calendarDays = [...week];

    if (!this.selectedDay) {
      this.selectedDay = this.calendarDays[0];
    }

    this.loadAppointments();
  }

  // =========================
  // CALENDARIO MES
  // =========================
  buildMonth() {

    const today = new Date();

    today.setMonth(
      today.getMonth() + this.currentMonthOffset
    );

    const year = today.getFullYear();

    const month = today.getMonth();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const weekDays = [
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb'
    ];

    const days: any[] = [];

    for (let i = 1; i <= daysInMonth; i++) {

      const date = new Date(year, month, i);

      const iso = this.normalizeDate(
        this.toLocalDate(date)
      );

      days.push({
        day: i,
        name: weekDays[date.getDay()],
        date: i,
        iso,
        appointments: []
      });
    }

    this.monthDays = [...days];

    this.loadAppointments();
  }

  // =========================
  // CARGAR CITAS
  // =========================
  loadAppointments(): void {

    const token = this.authService.getToken();

    if (!token) return;

    const source = this.viewMode === 'month'
      ? this.monthDays
      : this.calendarDays;

    if (!source.length) return;

    const start = source[0].iso;

    const end = source[source.length - 1].iso;

    this.reservasApiService
      .getAppointmentsInRange(start, end, token)
      .subscribe((res: AppointmentResponse[]) => {

        this.dayAppointments = res.map(a => ({
          id: a.id,
          time: a.startTime.substring(0, 5),
          name: a.guestName,
          appointmentDate: this.normalizeDate(
            (a as any).appointmentDate
          )
        }));

        this.groupAppointments();

        // RELLENAR CITAS EN VISTA MES
        if (this.viewMode === 'month') {

          this.monthDays = this.monthDays.map(day => ({
            ...day,
            appointments:
              this.appointmentsByDay[day.iso] || []
          }));
        }

        this.cdr.detectChanges();
      });
  }

  // =========================
  // AGRUPAR CITAS
  // =========================
  groupAppointments() {

    const grouped: {
      [key: string]: DayAppointment[]
    } = {};

    for (const appt of this.dayAppointments) {

      if (!grouped[appt.appointmentDate]) {

        grouped[appt.appointmentDate] = [];
      }

      grouped[appt.appointmentDate].push(appt);
    }

    this.appointmentsByDay = { ...grouped };
  }

  // =========================
  // MODAL
  // =========================
  openBookingModal(): void {

    this.showBookingOptions = true;

    this.bookingDate =
      this.selectedDay?.iso || '';

    this.bookingTime = '';
    this.guestName = '';
    this.guestPhone = '';
    this.selectedUserId = null;
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

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  closeBookingOptions(): void {
    this.showBookingOptions = false;
  }

  // =========================
  // CREAR CITA
  // =========================
  bookAppointment(): void {

    this.submitted = true;

    if (
      !this.bookingDate ||
      !this.bookingTime ||
      !this.guestName
    ) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) return;

    const request = {
      appointmentDate: this.bookingDate,
      startTime: this.bookingTime + ':00',
      guestName: this.guestName,
      guestPhone: this.guestPhone,
      userId: this.selectedUserId
    };

    this.reservasApiService
      .createAppointment(request, token)
      .subscribe(() => {

        this.closeBookingModal();

        this.loadAppointments();
      });
  }

  // =========================
  // USUARIOS
  // =========================
  loadUsers(): void {

    const token = this.authService.getToken();

    if (!token) return;

    this.reservasApiService
      .getUsers(token)
      .subscribe(res => {

        this.users = res;
      });
  }

  onUserSearch(event: Event): void {

    const value =
      (event.target as HTMLInputElement).value;

    if (!value) {

      this.userSuggestions = [];

      return;
    }

    const token = this.authService.getToken();

    if (!token) return;

    this.reservasApiService
      .searchUsers(value, token)
      .subscribe(res => {

        this.userSuggestions = res;

        this.showUserSuggestions = true;
      });
  }

  selectUser(user: any): void {

    this.selectedUserId = user.id;

    this.guestName =
      user.name + ' ' + user.surname;

    this.userSearchQuery = user.email;

    this.showUserSuggestions = false;
  }

  clearUser(): void {

    this.selectedUserId = null;

    this.guestName = '';

    this.userSearchQuery = '';
  }

  // =========================
  // NAV DÍA
  // =========================
  prevDay(): void {

    const i = this.calendarDays.findIndex(
      d => d.iso === this.selectedDay?.iso
    );

    if (i > 0) {

      this.selectedDay =
        this.calendarDays[i - 1];
    }
  }

  nextDay(): void {

    const i = this.calendarDays.findIndex(
      d => d.iso === this.selectedDay?.iso
    );

    if (i < this.calendarDays.length - 1) {

      this.selectedDay =
        this.calendarDays[i + 1];
    }
  }

  // =========================
  // TÍTULO
  // =========================
  get calendarTitle(): string {

    const base = new Date();

    if (this.viewMode === 'month') {

      base.setMonth(
        base.getMonth() + this.currentMonthOffset
      );

    } else {

      base.setDate(
        base.getDate() +
        this.currentWeekOffset * 7
      );
    }

    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];

    return `
      ${months[base.getMonth()]}
      ${base.getFullYear()}
    `;
  }

  // =========================
  // KPIS
  // =========================
  get kpis() {

    return [
      {
        title: 'Citas',
        value: this.dayAppointments.length,
        hint: 'Semana'
      },
      {
        title: 'Clientes',
        value: this.dayAppointments.length,
        hint: 'Activos'
      },
      {
        title: 'Horario',
        value: '09-18',
        hint: 'Laboral'
      }
    ];
  }

  // =========================
  // CANCELAR CITA
  // =========================
  cancelAppointment(id: number): void {

    const token = this.authService.getToken();

    if (!token) return;

    if (!confirm('¿Cancelar cita?')) return;

    this.reservasApiService
      .deleteAppointment(id, token)
      .subscribe(() => {

        this.dayAppointments =
          this.dayAppointments.filter(
            a => a.id !== id
          );

        this.groupAppointments();

        this.cdr.detectChanges();
      });
  }

  // =========================
  // UTIL
  // =========================
  normalizeDate(date: string): string {

    return date
      ? date.split('T')[0]
      : '';
  }

  getAppointmentsAt(day: any, time: string) {

    return (
      this.appointmentsByDay[day.iso] || []
    ).filter(a => a.time === time);
  }

  getAppointmentsByDay(day: any) {

    return this.appointmentsByDay[day.iso] || [];
  }

  get nextAppointment() {

    return this.dayAppointments[0] || null;
  }

  logout() {

    this.authService.logout();

    this.router.navigate([
      '/inicio-sesion'
    ]);
  }
}