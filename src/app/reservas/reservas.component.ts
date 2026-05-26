import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  AppointmentResponse,
  DayOfWeek,
  ReservasApiService,
  CreateAppointmentRequest,
  WorkingDaysResponse
} from '../reservas-api.service';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css',
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class ReservasComponent implements OnInit {

  currentDate = new Date();

  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  confirmedAppointmentTime: string | null = null;

  citaConfirmada = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = false;

  occupiedHours = new Set<string>();
  workingDays = new Set<DayOfWeek>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  morningStart = '10:00';
  morningEnd = '13:45';
  afternoonStart = '15:00';
  afternoonEnd = '18:00';

  availableHours: string[] = this.buildAvailableHours();
  myAppointments: AppointmentResponse[] = [];
  showMaxAppointmentsModal = false;

  get visibleHours(): string[] {
    return this.availableHours.filter(time => !this.isTimeOccupied(time));
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    public authService: AuthService,
    private reservasApiService: ReservasApiService
  ) {}

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.initializeDefaultDate();

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.loadReservationSchedule();
    this.loadMyAppointments(token);
  }

  @HostListener('window:focus')
  refreshScheduleOnFocus(): void {
    if (this.authService.isLoggedIn()) {
      this.loadReservationSchedule();
    }
  }

  // =========================
  // CALENDARIO
  // =========================

  getDaysOfMonth(date: Date): (number | null)[] {

    const year = date.getFullYear();

    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();

    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }

  isWeekday(day: number | null): boolean {

    if (!day) return false;

    const date = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      day
    );

    const dayOfWeek = this.toDayOfWeek(date);

    return this.workingDays.has(dayOfWeek);
  }

  isFutureDate(day: number | null): boolean {

    if (!day) return false;

    const date = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      day
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    date.setHours(0, 0, 0, 0);

    return date >= today;
  }

  selectDate(day: number | null): void {

    if (day && this.isWeekday(day) && this.isFutureDate(day)) {

      this.selectedDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );

      this.selectedTime = null;

      this.loadReservationSchedule();
    }
  }

  isSelected(day: number | null): boolean {

    if (!day || !this.selectedDate) return false;

    return (
      this.selectedDate.getDate() === day &&
      this.selectedDate.getMonth() === this.currentDate.getMonth() &&
      this.selectedDate.getFullYear() === this.currentDate.getFullYear()
    );
  }

  // =========================
  // HORAS
  // =========================

  selectTime(time: string): void {

    if (!this.visibleHours.includes(time)) return;

    this.selectedTime =
      this.selectedTime === time ? null : time;
  }

  isTimeOccupied(time: string): boolean {

    return this.occupiedHours.has(
      this.normalizeTimeToHourMinute(time)
    );
  }

  // =========================
  // CREAR CITA
  // =========================

  confirmBooking(): void {

    if (!this.selectedDate || !this.selectedTime || this.isSubmitting) return;

    if (this.getAppointmentCountForWeek(this.selectedDate) >= 2) {
      this.showMaxAppointmentsModal = true;
      return;
    }

    if (!this.availableHours.includes(this.selectedTime)) {
      this.errorMessage = 'La hora seleccionada no está dentro del horario del peluquero.';
      return;
    }

    if (this.isTimeOccupied(this.selectedTime)) {
      this.errorMessage = 'La hora seleccionada ya no está disponible.';
      this.selectedTime = null;
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = true;

    const appointmentDate = this.toIsoDate(this.selectedDate);

    const startTime = this.selectedTime + ':00';
    this.confirmedAppointmentTime = this.selectedTime;

    const token = this.authService.getToken();

    if (!token) {
      this.errorMessage = 'Debes iniciar sesión para reservar.';
      this.isSubmitting = false;
      return;
    }

    const payload: CreateAppointmentRequest = {
      appointmentDate,
      startTime,
      guestName: this.authService.getFullName(),
      guestPhone: undefined
    };

    this.reservasApiService
      .createAppointment(payload, token)
      .subscribe({

        next: (response) => {

          if (this.selectedTime) {

            this.occupiedHours.add(
              this.normalizeTimeToHourMinute(this.selectedTime)
            );
          }

          this.citaConfirmada = true;
          this.confirmedAppointmentTime = response.startTime
            ? this.normalizeTimeToHourMinute(response.startTime)
            : this.confirmedAppointmentTime;

          this.successMessage =
            response.message || 'Cita creada correctamente.';

          this.errorMessage = null;

          this.loadOccupiedHours();
          this.loadMyAppointments(token);
          this.isSubmitting = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.citaConfirmada = false;

          this.successMessage = null;

          this.errorMessage =
            error?.error?.message || 'Error al crear cita.';
          this.isSubmitting = false;
        }
      });
  }

  private loadMyAppointments(token: string): void {
    this.reservasApiService.getMyAppointments(token).subscribe({
      next: (appointments) => {
        this.myAppointments = appointments || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.myAppointments = [];
      }
    });
  }

  private getAppointmentCountForWeek(date: Date): number {
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startIso = this.toIsoDate(weekStart);
    const endIso = this.toIsoDate(weekEnd);

    return this.myAppointments.filter(appointment =>
      appointment.appointmentDate >= startIso && appointment.appointmentDate <= endIso
    ).length;
  }

  closeMaxAppointmentsModal(): void {
    this.showMaxAppointmentsModal = false;
  }

  // =========================
  // CANCELAR CITA
  // =========================

  cancelAppointment(id: number): void {

    const token = this.authService.getToken();

    if (!token) return;

    const confirmDelete = confirm(
      '¿Seguro que quieres cancelar esta cita?'
    );

    if (!confirmDelete) return;

    this.reservasApiService
      .deleteAppointment(id, token)
      .subscribe({

        next: () => {

          this.loadOccupiedHours();

          this.successMessage =
            'Cita cancelada correctamente.';

          this.errorMessage = null;
        },

        error: () => {

          this.errorMessage =
            'No se pudo cancelar la cita.';
        }
      });
  }

  // =========================
  // NAVEGACIÓN MES
  // =========================

  nextMonth(): void {

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );

    this.selectedDate = null;

    this.selectedTime = null;

    this.occupiedHours.clear();

    this.loadReservationSchedule();
  }

  previousMonth(): void {

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );

    this.selectedDate = null;

    this.selectedTime = null;

    this.occupiedHours.clear();

    this.loadReservationSchedule();
  }

  // =========================
  // OCUPADOS
  // =========================

  private loadOccupiedHours(): void {

    if (!this.selectedDate) {

      this.occupiedHours.clear();

      return;
    }

    const token = this.authService.getToken();

    if (!token) {

      this.occupiedHours.clear();

      return;
    }

    this.reservasApiService
      .getOccupiedSlots(
        this.toIsoDate(this.selectedDate),
        token
      )
      .subscribe({

        next: (occupiedSlots) => {

          this.occupiedHours = new Set(
            occupiedSlots.map(s =>
              this.normalizeTimeToHourMinute(s)
            )
          );

          if (this.selectedTime && this.isTimeOccupied(this.selectedTime)) {
            this.selectedTime = null;
          }

          this.cdr.detectChanges();
        },

        error: () => {

          this.occupiedHours.clear();
        }
      });
  }

  private loadReservationSchedule(): void {

    const token = this.authService.getToken();

    if (!token) return;

    this.reservasApiService
      .getReservationWorkingDays(token)
      .subscribe({

        next: (schedule) => {
          this.applyReservationSchedule(schedule);
          this.availableHours = this.buildAvailableHours();

          if (this.selectedDate && !this.isDateWorkingDay(this.selectedDate)) {
            this.selectedDate = this.findFirstAvailableDate(new Date());
            this.currentDate = new Date(
              this.selectedDate.getFullYear(),
              this.selectedDate.getMonth(),
              1
            );
            this.selectedTime = null;
          }

          if (this.selectedTime && !this.availableHours.includes(this.selectedTime)) {
            this.selectedTime = null;
          }

          this.loadOccupiedHours();
          this.cdr.detectChanges();
        },

        error: () => {
          this.availableHours = this.buildAvailableHours();
          this.loadOccupiedHours();
        }
      });
  }

  // =========================
  // HELPERS
  // =========================

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeTimeToHourMinute(time: string): string {

    return time.substring(0, 5);
  }

  private applyReservationSchedule(schedule: WorkingDaysResponse): void {
    this.workingDays = new Set(schedule.workingDays?.length ? schedule.workingDays : [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY'
    ]);
    this.morningStart = this.toHourMinute(schedule.morningStart || '10:00');
    this.morningEnd = this.toHourMinute(schedule.morningEnd || '13:45');
    this.afternoonStart = schedule.afternoonStart ? this.toHourMinute(schedule.afternoonStart) : '';
    this.afternoonEnd = schedule.afternoonEnd ? this.toHourMinute(schedule.afternoonEnd) : '';
  }

  private buildAvailableHours(): string[] {
    return [
      ...this.buildSlotsForRange(this.morningStart, this.morningEnd),
      ...this.buildSlotsForRange(this.afternoonStart, this.afternoonEnd)
    ];
  }

  private buildSlotsForRange(start: string, end: string): string[] {
    if (!start || !end) return [];

    const startMinutes = this.toMinutes(start);
    const endMinutes = this.toMinutes(end);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || startMinutes >= endMinutes) {
      return [];
    }

    const slots: string[] = [];
    for (let minutes = startMinutes; minutes + 15 <= endMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
      const minute = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
    return slots;
  }

  private findFirstAvailableDate(startDate: Date): Date {
    const candidate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    while (!this.isDateWorkingDay(candidate)) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  private isDateWorkingDay(date: Date): boolean {
    return this.workingDays.has(this.toDayOfWeek(date));
  }

  private toDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  private toMinutes(time: string): number {
    const hh = parseInt(time.slice(0, 2), 10);
    const mm = parseInt(time.slice(3, 5), 10);
    return hh * 60 + mm;
  }

  private toHourMinute(time: string): string {
    return time.substring(0, 5);
  }

  // =========================
  // UI
  // =========================

  volverAlInicio(): void {

    this.router.navigate(['/home']);
  }

  private initializeDefaultDate(): void {

    const today = new Date();

    this.currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const candidate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    while (
      !this.isDateWorkingDay(candidate)
    ) {
      candidate.setDate(candidate.getDate() + 1);
    }

    this.selectedDate = candidate;

    this.selectedTime = null;
  }

  getMonthYear(): string {

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

    return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  getFormattedDate(): string {

    if (!this.selectedDate) return '';

    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];

    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];

    const dayName = days[this.selectedDate.getDay()];

    const day = this.selectedDate.getDate();

    const month = months[this.selectedDate.getMonth()];

    const year = this.selectedDate.getFullYear();

    const time = this.confirmedAppointmentTime || this.selectedTime;
    const timeText = time ? ` a las ${time} h` : '';

    return `${dayName}, ${day} de ${month} de ${year}${timeText}`;
  }

  
isPastTime(time: string): boolean {
  if (!this.selectedDate) return false;

  const now = new Date();
  const selected = new Date(this.selectedDate);

  // Solo aplicar si es HOY
  const isToday =
    now.getDate() === selected.getDate() &&
    now.getMonth() === selected.getMonth() &&
    now.getFullYear() === selected.getFullYear();

  if (!isToday) return false;

  // Convertir horas "10:15" → Date
  const [hours, minutes] = time.split(':').map(Number);

  const timeDate = new Date(selected);
  timeDate.setHours(hours, minutes, 0, 0);

  return timeDate <= now;
}

}
