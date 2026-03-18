import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit(): void {}

  getDaysOfMonth(date: Date): (number | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Convertir getDay() (0=dom, 1=lun, ..., 6=sab) a índice de columna (0=lun, 1=mar, ..., 6=dom)
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
    // Solo lunes (1) a viernes (5)
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  selectDate(day: number | null): void {
    if (day && this.isWeekday(day)) {
      this.selectedDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );
      this.selectedTime = null;
    }
  }

  isSelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    return this.selectedDate.getDate() === day &&
           this.selectedDate.getMonth() === this.currentDate.getMonth() &&
           this.selectedDate.getFullYear() === this.currentDate.getFullYear();
  }

  selectTime(time: string): void {
    this.selectedTime = this.selectedTime === time ? null : time;
  }

  confirmBooking(): void {
    if (this.selectedDate && this.selectedTime) {
      console.log('Cita confirmada:', this.selectedDate, this.selectedTime);
      // TODO: Enviar al backend
      this.citaConfirmada = true;
    }
  }

  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return '';
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dayName = days[this.selectedDate.getDay()];
    const day = this.selectedDate.getDate();
    const month = months[this.selectedDate.getMonth()];
    const year = this.selectedDate.getFullYear();
    return `${dayName}, ${day} de ${month} de ${year} a las ${this.selectedTime} h`;
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.selectedDate = null;
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.selectedDate = null;
  }

  getMonthYear(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  getDayOfWeek(day: number | null): string {
    if (!day) return '';
    const date = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      day
    );
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }
}
