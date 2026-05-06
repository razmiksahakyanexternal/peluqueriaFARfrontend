import { Component, OnInit } from '@angular/core';
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

  // WEEK
  currentWeekOffset = 0;
  calendarDays: any[] = [];

  // MONTH
  currentMonthOffset = 0;
  monthDays: any[] = [];

  // DAY
  selectedDay: any = null;

  // APPOINTMENTS
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService
  ) {}

  ngOnInit(): void {

    this.currentUser = {
      name: this.authService.getName(),
      surname: this.authService.getSurname()
    };

    this.updateCalendar();
  }

  // =========================
  // 🔥 VIEW SWITCH
  // =========================
  setView(mode: 'day' | 'week' | 'month') {
    this.viewMode = mode;

    if (mode === 'month') {
      this.buildMonth();
    }

    if (mode === 'week' || mode === 'day') {
      this.updateCalendar();
    }
  }

  // =========================
  // 🔥 WEEK CONTROL
  // =========================
  setWeek(offset: number) {
    this.currentWeekOffset = offset;
    this.updateCalendar();
  }

  nextWeek() { this.setWeek(this.currentWeekOffset + 1); }
  prevWeek() { this.setWeek(this.currentWeekOffset - 1); }
  goToday() { this.setWeek(0); }

  // =========================
  // 🔥 MAIN WEEK BUILDER
  // =========================
  updateCalendar() {

    const today = new Date();
    today.setDate(today.getDate() + this.currentWeekOffset * 7);

    const week: any[] = [];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {

      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const iso = this.normalizeDate(date.toISOString());

      week.push({
        name: days[date.getDay()],
        date: date.getDate(),
        iso
      });
    }

    this.calendarDays = week;

    if (!this.selectedDay) {
      this.selectedDay = this.calendarDays[0];
    } else {
      const match = this.calendarDays.find(d => d.iso === this.selectedDay.iso);
      this.selectedDay = match || this.calendarDays[0];
    }

    this.loadAppointments();
  }

  // =========================
  // 🔥 MONTH BUILDER (FIX REAL)
  // =========================
  buildMonth() {

    const today = new Date();
    today.setMonth(today.getMonth() + this.currentMonthOffset);

    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const days: any[] = [];

    for (let i = 1; i <= daysInMonth; i++) {

      const date = new Date(year, month, i);
      const iso = this.normalizeDate(date.toISOString());

      days.push({
        name: weekDays[date.getDay()],
        date: i,
        iso
      });
    }

    this.monthDays = days;

    this.loadAppointments();
  }

  // =========================
  // 🔥 MONTH NAV
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
  // 🔥 APPOINTMENTS
  // =========================
  loadAppointments(): void {

    const token = this.authService.getToken()!;
    if (!this.calendarDays.length && !this.monthDays.length) return;

    const source = this.viewMode === 'month'
      ? this.monthDays
      : this.calendarDays;

    const start = source[0].iso;
    const end = source[source.length - 1].iso;

    this.reservasApiService.getAppointmentsInRange(start, end, token)
      .subscribe((res: AppointmentResponse[]) => {

        this.dayAppointments = res.map(a => ({
          id: a.id,
          time: a.startTime.substring(0, 5),
          name: a.guestName,
          appointmentDate: this.normalizeDate((a as any).appointmentDate)
        }));

        this.groupAppointments();
      });
  }

  groupAppointments() {

    this.appointmentsByDay = {};

    for (let appt of this.dayAppointments) {

      if (!this.appointmentsByDay[appt.appointmentDate]) {
        this.appointmentsByDay[appt.appointmentDate] = [];
      }

      this.appointmentsByDay[appt.appointmentDate].push(appt);
    }
  }

  // =========================
  // 🔥 DAY NAV
  // =========================
  nextDay() {
    const idx = this.calendarDays.indexOf(this.selectedDay);
    if (idx < this.calendarDays.length - 1) {
      this.selectedDay = this.calendarDays[idx + 1];
    }
  }

  prevDay() {
    const idx = this.calendarDays.indexOf(this.selectedDay);
    if (idx > 0) {
      this.selectedDay = this.calendarDays[idx - 1];
    }
  }

  // =========================
  // 🔥 HELPERS
  // =========================
  normalizeDate(date: string): string {
    return date ? date.split('T')[0] : '';
  }

  getAppointmentsAt(day: any, time: string) {
    if (!day) return [];
    return (this.appointmentsByDay[day.iso] || []).filter(a => a.time === time);
  }

  getAppointmentsByDay(day: any) {
    return this.appointmentsByDay[day.iso] || [];
  }

  // =========================
  // 🔥 UI
  // =========================
  get kpis() {
    return [
      { title: 'Citas', value: this.dayAppointments.length, hint: 'Semana' },
      { title: 'Clientes', value: this.dayAppointments.length, hint: 'Activos' },
      { title: 'Horario', value: '09-18', hint: 'Laboral' }
    ];
  }

  get nextAppointment() {
    return this.dayAppointments[0] || null;
  }

  openBookingModal() {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }
}