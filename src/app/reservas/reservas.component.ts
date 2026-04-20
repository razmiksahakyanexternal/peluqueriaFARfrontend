import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsLocalService } from '../appointments-local.service';
import { ReservasApiService, CreateAppointmentRequest } from '../reservas-api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css',
  standalone: false
})
export class ReservasComponent implements OnInit {
  currentDate = new Date();
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  citaConfirmada = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  occupiedHours = new Set<string>();

  availableHours: string[] = [
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45'
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    public authService: AuthService,
    private appointmentsLocalService: AppointmentsLocalService,
    private reservasApiService: ReservasApiService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.initializeDefaultDate();
    this.loadOccupiedHours();
  }

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
    return days;
  }

  isWeekday(day: number | null): boolean {
    if (!day) return false;
    const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  isFutureDate(day: number | null): boolean {
    if (!day) return false;
    const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
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
      this.loadOccupiedHours();
    }
  }

  isSelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    return this.selectedDate.getDate() === day &&
           this.selectedDate.getMonth() === this.currentDate.getMonth() &&
           this.selectedDate.getFullYear() === this.currentDate.getFullYear();
  }

  selectTime(time: string): void {
    if (this.isTimeOccupied(time)) {
      return;
    }
    this.selectedTime = this.selectedTime === time ? null : time;
  }

  isTimeOccupied(time: string): boolean {
    return this.occupiedHours.has(this.normalizeTimeToHourMinute(time));
  }

  confirmBooking(): void {
    if (this.selectedDate && this.selectedTime) {
      this.errorMessage = null;
      this.successMessage = null;
      const appointmentDate = this.toIsoDate(this.selectedDate);
      const startTime = this.selectedTime + ':00'; // formato HH:mm:ss
      const token = this.authService.getToken();
      if (!token) {
        this.errorMessage = 'Debes iniciar sesión para reservar.';
        return;
      }
      const payload: CreateAppointmentRequest = {
        appointmentDate,
        startTime,
        guestName: this.authService.getFullName(),
        guestPhone: undefined // Puedes pedirlo en el formulario si lo necesitas
      };
      this.reservasApiService.createAppointment(payload, token).subscribe({
        next: (response) => {
          if (this.selectedTime) {
            this.occupiedHours.add(this.normalizeTimeToHourMinute(this.selectedTime));
          }
          this.citaConfirmada = true;
          this.successMessage = response.message || 'La cita se ha confirmado correctamente.';
          this.errorMessage = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.citaConfirmada = false;
          this.successMessage = null;
          this.errorMessage = error?.error?.message || 'No se pudo guardar la cita.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return '';
    const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dayName = days[this.selectedDate.getDay()];
    const day = this.selectedDate.getDate();
    const month = months[this.selectedDate.getMonth()];
    const year = this.selectedDate.getFullYear();
    return `${dayName}, ${day} de ${month} de ${year} a las ${this.selectedTime} h`;
  }

  previousMonth(): void {
    const newDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    
    if (newDate >= today) {
      this.currentDate = newDate;
      this.selectedDate = null;
      this.selectedTime = null;
      this.occupiedHours.clear();
    }
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.selectedDate = null;
    this.selectedTime = null;
    this.occupiedHours.clear();
  }

  getMonthYear(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  isCurrentMonth(): boolean {
    const today = new Date();
    return this.currentDate.getFullYear() === today.getFullYear() &&
           this.currentDate.getMonth() === today.getMonth();
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

    this.reservasApiService.getOccupiedSlots(this.toIsoDate(this.selectedDate), token).subscribe({
      next: (occupiedSlots) => {
        this.occupiedHours = new Set(
          occupiedSlots.map((slot) => this.normalizeTimeToHourMinute(slot))
        );
        if (this.selectedTime && this.isTimeOccupied(this.selectedTime)) {
          this.selectedTime = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.occupiedHours.clear();
        this.cdr.detectChanges();
      }
    });
  }

  private initializeDefaultDate(): void {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (candidate.getDay() === 0 || candidate.getDay() === 6) {
      candidate.setDate(candidate.getDate() + 1);
    }

    this.selectedDate = candidate;
    this.selectedTime = null;
  }

  private normalizeTimeToHourMinute(time: string): string {
    return time.length >= 5 ? time.substring(0, 5) : time;
  }
}
