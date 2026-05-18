import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import {
  AppointmentResponse,
  BlockedSlotItem,
  CreateBlockedSlotRequest,
  DayOfWeek,
  ReservasApiService,
  UserItem,
} from '../reservas-api.service';

interface CalendarDay {
  name: string;
  date: number;
  iso: string;
  day?: number;
  appointments?: AppointmentResponse[];
  isPlaceholder?: boolean;
}

interface DayAppointment {
  id: number;
  time: string;
  name: string;
  appointmentDate: string;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  actionLabel: string;
  tone: 'danger' | 'default';
  pending: boolean;
  onConfirm: (() => void) | null;
}

@Component({
  selector: 'app-peluquero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './peluquero.component.html',
  styleUrl: './peluquero.component.css',
})
export class PeluqueroComponent implements OnInit {
  viewMode: 'day' | 'week' | 'month' = 'week';
  currentUser = { name: '', surname: '' };

  currentWeekOffset = 0;
  currentMonthOffset = 0;
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  monthDays: CalendarDay[] = [];

  appointments: AppointmentResponse[] = [];
  dayAppointments: DayAppointment[] = [];
  appointmentsByDay: Record<string, DayAppointment[]> = {};

  blockedSlots: BlockedSlotItem[] = [];
  private blockedByDate = new Map<string, { allDay: boolean; intervals: Array<[number, number]> }>();

  workingDays = new Set<DayOfWeek>();
  workingDaysDraft = new Set<DayOfWeek>();
  morningStart = '10:00';
  morningEnd = '13:45';
  afternoonStart = '15:00';
  afternoonEnd = '18:00';
  readonly morningMin = '08:00';
  readonly morningMax = '13:45';
  readonly afternoonMin = '14:00';
  readonly afternoonMax = '20:45';
  showWorkingDaysModal = false;
  workingDaysError: string | null = null;
  workingDaysSuccess: string | null = null;
  isSavingWorkingDays = false;

  showBookingOptions = false;
  showBookingModal = false;
  clientType: 'registered' | 'unregistered' | null = null;
  bookingDate = '';
  bookingTime = '';
  guestName = '';
  guestPhone = '';
  selectedUserId: number | null = null;
  bookingErrorMessage: string | null = null;
  bookingSuccessMessage: string | null = null;
  isBookingAppointment = false;
  bookingOccupiedTimes = new Set<string>();

  users: UserItem[] = [];
  userSearchQuery = '';
  userSuggestions: UserItem[] = [];
  showUserSuggestions = false;

  // Validacion de formulario
  submitted = false;
  dateError = '';
  timeError = '';
  guestNameError = '';

  showBlockModal = false;
  blockDate = '';
  blockAllDay = false;
  blockStartTime = '';
  blockEndTime = '';
  editingBlockedSlotId: number | null = null;
  blockSuccessMessage: string | null = null;
  blockErrorMessage: string | null = null;
  isBlocking = false;
  isDeletingBlockId: number | null = null;

  showConfirmModal = false;
  confirmDialog: ConfirmDialogState = {
    title: '',
    message: '',
    actionLabel: 'Confirmar',
    tone: 'default',
    pending: false,
    onConfirm: null,
  };

  timeSlots: string[] = [];

  readonly workingDayOptions: Array<{ value: DayOfWeek; label: string }> = [
    { value: 'MONDAY', label: 'Lunes' },
    { value: 'TUESDAY', label: 'Martes' },
    { value: 'WEDNESDAY', label: 'Miércoles' },
    { value: 'THURSDAY', label: 'Jueves' },
    { value: 'FRIDAY', label: 'Viernes' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
  ];
  private readonly defaultWorkingDays = new Set<DayOfWeek>([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ]);

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservasApiService: ReservasApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = {
      name: this.authService.getName() || 'Profesional',
      surname: this.authService.getSurname() || '',
    };

    this.timeSlots = this.buildDefaultTimeSlots();
    this.updateCalendar();
    this.loadUsers();
    this.loadWorkingDays();
  }

  setView(mode: 'day' | 'week' | 'month'): void {
    this.viewMode = mode;
    if (mode === 'month') {
      this.buildMonth();
    } else {
      this.updateCalendar();
      if (mode === 'day') {
        this.selectTodayInCurrentWeek();
      }
    }
  }

  setWeek(offset: number): void {
    this.currentWeekOffset = offset;
    this.updateCalendar();
  }

  nextWeek(): void {
    this.setWeek(this.currentWeekOffset + 1);
  }

  prevWeek(): void {
    this.setWeek(this.currentWeekOffset - 1);
  }

  nextMonth(): void {
    this.currentMonthOffset++;
    this.buildMonth();
  }

  prevMonth(): void {
    this.currentMonthOffset--;
    this.buildMonth();
  }

  goPreviousPeriod(): void {
    if (this.viewMode === 'month') {
      this.prevMonth();
      return;
    }
    if (this.viewMode === 'day') {
      this.prevDay();
      return;
    }
    this.prevWeek();
  }

  goNextPeriod(): void {
    if (this.viewMode === 'month') {
      this.nextMonth();
      return;
    }
    if (this.viewMode === 'day') {
      this.nextDay();
      return;
    }
    this.nextWeek();
  }

  goToday(): void {
    this.currentWeekOffset = 0;
    this.currentMonthOffset = 0;
    if (this.viewMode === 'month') {
      this.buildMonth();
    } else {
      this.updateCalendar();
    }
  }

  updateCalendar(): void {
    const today = new Date();
    today.setDate(today.getDate() + this.currentWeekOffset * 7);

    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    const names = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    this.calendarDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        name: names[date.getDay()],
        date: date.getDate(),
        iso: this.toLocalDate(date),
      };
    });

    if (!this.selectedDay || !this.calendarDays.some(day => day.iso === this.selectedDay?.iso)) {
      this.selectedDay = this.calendarDays[0];
    }

    this.loadAppointments();
    this.loadBlockedSlots();
  }

  buildMonth(): void {
    const today = new Date();
    today.setMonth(today.getMonth() + this.currentMonthOffset);
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = new Date(year, month, 1).getDay();
    const names = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const leadingDays = Array.from({ length: firstDayOffset }, () => ({
      day: undefined,
      date: 0,
      name: '',
      iso: '',
      appointments: [],
      isPlaceholder: true,
    }));

    const realDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        day: i + 1,
        date: i + 1,
        name: names[date.getDay()],
        iso: this.toLocalDate(date),
        appointments: [],
      };
    });

    this.monthDays = [...leadingDays, ...realDays];

    while (this.monthDays.length % 7 !== 0) {
      this.monthDays.push({
        day: undefined,
        date: 0,
        name: '',
        iso: '',
        appointments: [],
        isPlaceholder: true,
      });
    }

    this.loadAppointments();
    this.loadBlockedSlots();
  }

  openBookingModal(): void {
    this.showBookingOptions = true;
    this.showBookingModal = false;

    // Reset básico
    this.bookingDate = this.toLocalDate(new Date());
    this.bookingTime = '';
    this.selectedUserId = null;
    this.guestName = '';
    this.guestPhone = '';
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;

    this.userSearchQuery = '';
    this.userSuggestions = [];
    this.showUserSuggestions = false;
    this.submitted = false;
    this.dateError = '';
    this.timeError = '';
    this.guestNameError = '';
  }

  openRegisteredBooking(): void {
    this.clientType = 'registered';
    this.showBookingOptions = false;
    this.showBookingModal = true;
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;
    this.submitted = false;
    this.dateError = '';
    this.timeError = '';
    this.guestNameError = '';
    this.loadBookingOccupiedTimes();
  }

  openUnregisteredBooking(): void {
    this.clientType = 'unregistered';
    this.showBookingOptions = false;
    this.showBookingModal = true;
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;
    this.submitted = false;
    this.dateError = '';
    this.timeError = '';
    this.guestNameError = '';
    this.loadBookingOccupiedTimes();
  }

  closeBookingModal(): void {
    if (this.isBookingAppointment) {
      return;
    }

    this.showBookingModal = false;
  }

  closeBookingOptions(): void {
    this.showBookingOptions = false;
  }

  onBookingDateChange(): void {
    this.bookingErrorMessage = null;
    this.loadBookingOccupiedTimes();
    if (this.bookingTime && this.isBookingSlotUnavailable(this.bookingTime)) {
      this.bookingTime = '';
    }
  }

  bookAppointment(): void {
    this.submitted = true;
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;
    this.dateError = '';
    this.timeError = '';
    this.guestNameError = '';

    if (this.isBookingAppointment) {
      return;
    }

    let hasValidationError = false;

    const isNonWorkingBookingDate = !!this.bookingDate && this.isNonWorkingDate(this.bookingDate);

    // Validar fecha
    if (!this.bookingDate) {
      this.dateError = 'La fecha es obligatoria';
      hasValidationError = true;
    } else if (this.isPastDate(this.bookingDate)) {
      this.dateError = 'No se puede reservar en una fecha anterior a hoy';
      hasValidationError = true;
    } else if (isNonWorkingBookingDate) {
      this.dateError = 'No se puede reservar una cita fuera de los días laborables del peluquero';
      this.bookingErrorMessage = this.dateError;
      hasValidationError = true;
    }

    // Validar hora
    if (!this.bookingTime) {
      this.timeError = 'La hora es obligatoria';
      hasValidationError = true;
    } else if (isNonWorkingBookingDate) {
      this.timeError = 'No disponible en un día no laborable';
      hasValidationError = true;
    } else if (this.isBookingTimeBlocked(this.bookingTime)) {
      this.timeError = 'Esta hora está bloqueada';
      this.bookingErrorMessage = 'No se puede reservar una cita en un horario bloqueado';
      hasValidationError = true;
    } else if (this.isBookingTimeOccupied(this.bookingTime)) {
      this.timeError = 'Esta hora ya tiene una cita';
      this.bookingErrorMessage = 'Ya existe una cita en esa franja horaria';
      hasValidationError = true;
    } else if (this.isPastDateTime(this.bookingDate, this.bookingTime)) {
      this.timeError = 'Selecciona una hora disponible';
      this.bookingErrorMessage = 'No se puede reservar en una hora que ya ha pasado';
      hasValidationError = true;
    }

    // Validar según tipo de cliente
    if (this.clientType === 'registered') {
      if (!this.selectedUserId) {
        this.guestNameError = 'Selecciona un cliente de la lista';
        hasValidationError = true;
      }
    } else if (this.clientType === 'unregistered') {
      if (!this.guestName.trim()) {
        this.guestNameError = 'El nombre del cliente es obligatorio';
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      return;
    }

    // Validar teléfono si se proporciona
    if (this.guestPhone && !/^\d{1,9}$/.test(this.guestPhone.trim())) {
      this.bookingErrorMessage = 'El teléfono debe contener solo números y tener como máximo 9 dígitos';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.bookingErrorMessage = 'No autenticado';
      return;
    }

    this.isBookingAppointment = true;

    this.reservasApiService.createAppointment({
      appointmentDate: this.bookingDate,
      startTime: this.appendSeconds(this.bookingTime),
      guestName: this.guestName.trim(),
      guestPhone: this.guestPhone.trim() || undefined,
      userId: this.clientType === 'registered' ? this.selectedUserId : undefined,
    }, token).subscribe({
      next: () => {
        this.bookingSuccessMessage = 'Cita reservada correctamente';
        this.isBookingAppointment = false;
        this.submitted = false;
        this.loadAppointments();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.closeBookingModal();
          this.refreshCalendarView();
        }, 700);
      },
      error: (error) => {
        this.bookingErrorMessage = this.getApiErrorMessage(error, 'Error al reservar cita');
        this.isBookingAppointment = false;
        this.cdr.detectChanges();
      },
    });
  }

  onUserSearch(event: any): void {
    const query = (event.target?.value || '').trim();
    this.userSearchQuery = query;

    if (!query) {
      this.userSuggestions = [];
      this.showUserSuggestions = false;
      this.cdr.detectChanges();
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.reservasApiService.searchUsers(query, token).subscribe({
      next: (users) => {
        this.userSuggestions = users;
        this.showUserSuggestions = users.length > 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.userSuggestions = [];
        this.showUserSuggestions = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectUser(user: UserItem): void {
    this.selectedUserId = user.id;
    this.guestName = `${user.name} ${user.surname}`;
    this.userSearchQuery = user.email;
    this.userSuggestions = [];
    this.showUserSuggestions = false;
    this.guestNameError = '';
    this.cdr.detectChanges();
  }

  clearUser(): void {
    this.selectedUserId = null;
    this.guestName = '';
    this.userSearchQuery = '';
    this.userSuggestions = [];
    this.showUserSuggestions = false;
    this.cdr.detectChanges();
  }

  blockNonNumericPhoneInput(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  blockInvalidPhonePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    const currentValue = this.guestPhone || '';
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? currentValue.length;
    const selectionEnd = input.selectionEnd ?? currentValue.length;
    const nextValue = currentValue.slice(0, selectionStart) + pastedText + currentValue.slice(selectionEnd);

    if (!/^\d{0,9}$/.test(nextValue)) {
      event.preventDefault();
    }
  }

  onBlurUser(): void {
    setTimeout(() => {
      this.showUserSuggestions = false;
      this.cdr.detectChanges();
    }, 200);
  }

  onFocusUser(): void {
    if (this.userSearchQuery) {
      this.showUserSuggestions = this.userSuggestions.length > 0;
      this.cdr.detectChanges();
    }
  }

  prevDay(): void {
    this.moveSelectedDay(-1);
  }

  nextDay(): void {
    this.moveSelectedDay(1);
  }

  cancelAppointment(id: number): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.openConfirmModal({
      title: 'Cancelar cita',
      message: 'Esta cita desaparecera de la agenda y dejara libre ese hueco.',
      actionLabel: 'Cancelar cita',
      tone: 'danger',
      onConfirm: () => {
        this.showConfirmModal = false;
        this.reservasApiService.deleteAppointment(id, token).subscribe({
          next: () => {
            this.dayAppointments = this.dayAppointments.filter(appointment => appointment.id !== id);
            this.appointments = this.appointments.filter(appointment => appointment.id !== id);
            this.groupAppointments();
            this.fillMonthAppointments();
            this.resetConfirmModal();
            this.cdr.detectChanges();
          },
          error: () => {
            this.resetConfirmModal();
          },
        });
      },
    });
  }

  openBlockModal(): void {
    this.showBlockModal = true;
    const today = this.todayIso;
    const selectedDate = this.selectedDay?.iso || this.currentRange?.start || today;
    
    // Si la fecha seleccionada está en el pasado, usar hoy
    this.blockDate = selectedDate < today ? today : selectedDate;
    
    this.blockAllDay = false;
    this.blockStartTime = '';
    this.blockEndTime = '';
    this.editingBlockedSlotId = null;
    this.blockSuccessMessage = null;
    this.blockErrorMessage = null;
  }

  closeBlockModal(): void {
    if (this.isBlocking) {
      return;
    }

    this.showBlockModal = false;
  }

  blockSlot(): void {
    if (this.isBlocking) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.blockErrorMessage = 'No autenticado';
      return;
    }

    if (!this.blockDate) {
      this.blockErrorMessage = 'Selecciona fecha';
      return;
    }

    const payload: CreateBlockedSlotRequest = {
      blockedDate: this.blockDate,
      allDay: this.blockAllDay,
    };

    if (!this.blockAllDay) {
      if (!this.blockStartTime || !this.blockEndTime) {
        this.blockErrorMessage = 'Selecciona hora de inicio y fin';
        return;
      }

      if (this.toMinutes(this.blockStartTime) >= this.toMinutes(this.blockEndTime)) {
        this.blockErrorMessage = 'La hora de fin debe ser posterior a la de inicio.';
        return;
      }

      payload.startTime = `${this.blockStartTime}:00`;
      payload.endTime = `${this.blockEndTime}:00`;
    }

    this.isBlocking = true;
    this.blockErrorMessage = null;
    const request$ = this.editingBlockedSlotId
      ? this.reservasApiService.updateBlockedSlot(this.editingBlockedSlotId, payload, token)
      : this.reservasApiService.createBlockedSlot(payload, token);

    request$.subscribe({
      next: (saved) => {
        this.blockSuccessMessage = this.editingBlockedSlotId ? 'Bloqueo actualizado' : 'Bloqueo guardado';
        this.blockedSlots = this.editingBlockedSlotId
          ? this.blockedSlots.map(slot => slot.id === saved.id ? saved : slot)
          : [...this.blockedSlots, saved];
        this.editingBlockedSlotId = null;
        this.isBlocking = false;
        this.rebuildBlockedLookups();
        this.refreshCalendarView();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.blockErrorMessage = error?.error?.message || 'Error al guardar bloqueo';
        this.isBlocking = false;
      },
    });
  }

  editBlockedSlot(slot: BlockedSlotItem): void {
    this.showBlockModal = true;
    this.editingBlockedSlotId = slot.id;
    this.blockDate = slot.blockedDate;
    this.blockAllDay = slot.allDay;
    this.blockStartTime = slot.startTime ? slot.startTime.slice(0, 5) : '';
    this.blockEndTime = slot.endTime ? slot.endTime.slice(0, 5) : '';
    this.blockSuccessMessage = null;
    this.blockErrorMessage = null;
  }

  deleteBlockedSlot(slot: BlockedSlotItem): void {
    const token = this.authService.getToken();
    if (!token || this.isDeletingBlockId) {
      return;
    }

    this.openConfirmModal({
      title: 'Eliminar bloqueo',
      message: 'Ese tramo volverá a estar disponible para gestionar citas.',
      actionLabel: 'Eliminar bloqueo',
      tone: 'danger',
      onConfirm: () => {
        this.showConfirmModal = false;
        this.isDeletingBlockId = slot.id;
        this.reservasApiService.deleteBlockedSlot(slot.id, token).subscribe({
          next: () => {
            this.blockedSlots = this.blockedSlots.filter(item => item.id !== slot.id);
            this.isDeletingBlockId = null;
            this.rebuildBlockedLookups();
            this.refreshCalendarView();
            this.resetConfirmModal();
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.blockErrorMessage = error?.error?.message || 'Error al eliminar bloqueo';
            this.isDeletingBlockId = null;
            this.resetConfirmModal();
          },
        });
      },
    });
  }

  openWorkingDaysModal(): void {
    this.showWorkingDaysModal = true;
    this.workingDaysDraft = new Set(this.workingDays);
    this.workingDaysError = null;
    this.workingDaysSuccess = null;
  }

  closeWorkingDaysModal(): void {
    if (this.isSavingWorkingDays) {
      return;
    }

    this.showWorkingDaysModal = false;
  }

  toggleWorkingDay(day: DayOfWeek, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.workingDaysDraft.add(day);
    } else {
      this.workingDaysDraft.delete(day);
    }
  }

  saveWorkingDays(): void {
    this.workingDaysError = null;
    this.workingDaysSuccess = null;

    const token = this.authService.getToken();
    if (!token) {
      this.workingDaysError = 'No autenticado';
      return;
    }

    const days = Array.from(this.workingDaysDraft);
    if (days.length === 0) {
      this.workingDaysError = 'Debes seleccionar al menos un día laborable';
      return;
    }

    if (!this.morningStart || !this.morningEnd) {
      this.workingDaysError = 'Completa el horario de la mañana.';
      return;
    }

    if (!this.isQuarterHour(this.morningStart) || !this.isQuarterHour(this.morningEnd)) {
      this.workingDaysError = 'El horario de mañana debe ir de 15 en 15 minutos.';
      return;
    }

    if (!this.isTimeInsideLimits(this.morningStart, this.morningMin, this.morningMax)
      || !this.isTimeInsideLimits(this.morningEnd, this.morningMin, this.morningMax)) {
      this.workingDaysError = 'La mañana debe estar entre 08:00 y 13:45.';
      return;
    }

    if (this.toMinutes(this.morningStart) >= this.toMinutes(this.morningEnd)) {
      this.workingDaysError = 'La mañana debe tener una hora de inicio anterior a la de fin.';
      return;
    }

    const hasAfternoon = !!this.afternoonStart || !!this.afternoonEnd;
    if (hasAfternoon) {
      if (!this.afternoonStart || !this.afternoonEnd) {
        this.workingDaysError = 'Completa inicio y fin del tramo de tarde.';
        return;
      }

      if (!this.isQuarterHour(this.afternoonStart) || !this.isQuarterHour(this.afternoonEnd)) {
        this.workingDaysError = 'El horario de tarde debe ir de 15 en 15 minutos.';
        return;
      }

      if (!this.isTimeInsideLimits(this.afternoonStart, this.afternoonMin, this.afternoonMax)
        || !this.isTimeInsideLimits(this.afternoonEnd, this.afternoonMin, this.afternoonMax)) {
        this.workingDaysError = 'La tarde debe estar entre 14:00 y 20:45.';
        return;
      }

      if (this.toMinutes(this.afternoonStart) >= this.toMinutes(this.afternoonEnd)) {
        this.workingDaysError = 'La tarde debe tener una hora de inicio anterior a la de fin.';
        return;
      }

      if (this.toMinutes(this.afternoonStart) < this.toMinutes(this.morningEnd)) {
        this.workingDaysError = 'La tarde debe empezar después de la mañana.';
        return;
      }
    }

    this.isSavingWorkingDays = true;
    this.reservasApiService.setWorkingDays({
      workingDays: days,
      morningStart: this.appendSeconds(this.morningStart),
      morningEnd: this.appendSeconds(this.morningEnd),
      afternoonStart: this.afternoonStart ? this.appendSeconds(this.afternoonStart) : null,
      afternoonEnd: this.afternoonEnd ? this.appendSeconds(this.afternoonEnd) : null,
    }, token).subscribe({
      next: (response) => {
        this.workingDaysError = null;
        this.workingDays = new Set(response.workingDays ?? days);
        this.workingDaysDraft = new Set(this.workingDays);
        this.morningStart = this.toHourMinute(response.morningStart || this.morningStart);
        this.morningEnd = this.toHourMinute(response.morningEnd || this.morningEnd);
        this.afternoonStart = response.afternoonStart ? this.toHourMinute(response.afternoonStart) : '';
        this.afternoonEnd = response.afternoonEnd ? this.toHourMinute(response.afternoonEnd) : '';
        this.timeSlots = this.buildTimeSlots();
        this.workingDaysSuccess = 'Horario actualizado';
        this.isSavingWorkingDays = false;
        this.refreshCalendarView();
        this.cdr.detectChanges();
        setTimeout(() => this.closeWorkingDaysModal(), 700);
      },
      error: (error) => {
        this.workingDaysSuccess = null;
        this.workingDaysError = error?.error?.message || 'Error al guardar días laborables';
        this.isSavingWorkingDays = false;
      },
    });
  }

  isSlotBlocked(isoDate: string, time: string): boolean {
    const entry = this.blockedByDate.get(isoDate);
    if (!entry) {
      return false;
    }
    if (entry.allDay) {
      return true;
    }
    const slotStart = this.toMinutes(time);
    const slotEnd = slotStart + 15;
    return entry.intervals.some(([start, end]) => slotStart < end && slotEnd > start);
  }

  isBookingTimeBlocked(time: string): boolean {
    return !!this.bookingDate && this.isSlotBlocked(this.bookingDate, time);
  }

  isBookingTimeOccupied(time: string): boolean {
    if (!this.bookingDate) {
      return false;
    }

    return this.bookingOccupiedTimes.has(time)
      || (this.appointmentsByDay[this.bookingDate] || []).some(appointment => appointment.time === time);
  }

  isBookingSlotUnavailable(time: string): boolean {
    return this.getBookingSlotUnavailableReason(time) !== '';
  }

  getBookingSlotLabel(time: string): string {
    const reason = this.getBookingSlotUnavailableReason(time);
    return reason ? `${time} - ${reason}` : time;
  }

  getBookingSlotUnavailableReason(time: string): string {
    if (this.isNonWorkingDate(this.bookingDate)) {
      return 'Día no laborable';
    }
    if (this.isBookingTimeBlocked(time)) {
      return 'Bloqueado';
    }
    if (this.isBookingTimeOccupied(time)) {
      return 'Ocupado';
    }
    if (this.isPastDateTime(this.bookingDate, time)) {
      return 'Hora pasada';
    }
    return '';
  }

  isNonWorkingDate(isoDate: string): boolean {
    if (!isoDate) {
      return false;
    }

    const map: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const day = new Date(`${isoDate}T00:00:00`).getDay();
    const workingDays = this.workingDays.size > 0 ? this.workingDays : this.defaultWorkingDays;
    return !workingDays.has(map[day]);
  }

  get blockedSlotsForSelectedDate(): BlockedSlotItem[] {
    const iso = this.blockDate || this.selectedDay?.iso || '';
    return this.blockedSlots.filter(slot => slot.blockedDate === iso);
  }

  get workingDaysText(): string {
    return this.workingDayOptions
      .filter(option => this.workingDays.has(option.value))
      .map(option => option.label)
      .join(', ');
  }

  get workingHoursText(): string {
    const morning = `${this.morningStart} - ${this.morningEnd}`;
    if (!this.afternoonStart || !this.afternoonEnd) {
      return morning;
    }
    return `${morning} / ${this.afternoonStart} - ${this.afternoonEnd}`;
  }

  get calendarTitle(): string {
    if (this.viewMode === 'day') {
      const iso = this.selectedDay?.iso || this.todayIso;
      return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    if (this.viewMode === 'week' && this.calendarDays.length > 0) {
      const start = new Date(`${this.calendarDays[0].iso}T00:00:00`);
      const end = new Date(`${this.calendarDays[this.calendarDays.length - 1].iso}T00:00:00`);
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

      if (sameMonth) {
        const monthYear = end.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return `semana del ${start.getDate()} al ${end.getDate()} de ${monthYear}`;
      }

      const startText = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
      const endText = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return `semana del ${startText} al ${endText}`;
    }

    const base = new Date();
    base.setMonth(base.getMonth() + this.currentMonthOffset);

    return base.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  get formattedToday(): string {
    const iso = this.selectedDay?.iso || this.toLocalDate(new Date());
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  get todayIso(): string {
    return this.toLocalDate(new Date());
  }

  get kpis(): Array<{ title: string; value: string | number; hint: string }> {
    const visibleAppointments = this.visibleAppointments;
    return [
      { title: 'Citas', value: visibleAppointments.length, hint: this.viewMode === 'day' ? 'Dia' : this.viewMode === 'month' ? 'Mes' : 'Periodo' },
      { title: 'Clientes', value: new Set(visibleAppointments.map(item => item.name)).size, hint: 'Activos' },
      { title: 'Horario actual', value: this.workingHoursText, hint: '' },
    ];
  }

  get bookingTimeSlots(): string[] {
    return this.timeSlots.filter(time => !this.isPastDateTime(this.bookingDate, time));
  }

  get nextAppointment(): DayAppointment | null {
    return this.visibleAppointments[0] || null;
  }

  get nextAppointmentDateText(): string {
    const iso = this.nextAppointment?.appointmentDate || this.selectedDay?.iso || this.todayIso;
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  get currentRange(): { start: string; end: string } | null {
    if (this.viewMode === 'month') {
      const validDays = this.monthDays.filter(day => !day.isPlaceholder);
      if (!validDays.length) {
        return null;
      }
      return { start: validDays[0].iso, end: validDays[validDays.length - 1].iso };
    }
    if (!this.calendarDays.length) {
      return null;
    }
    return { start: this.calendarDays[0].iso, end: this.calendarDays[this.calendarDays.length - 1].iso };
  }

  get visibleAppointments(): DayAppointment[] {
    if (this.viewMode === 'day' && this.selectedDay) {
      return this.appointmentsByDay[this.selectedDay.iso] || [];
    }
    return this.dayAppointments;
  }

  getAppointmentsAt(day: CalendarDay | null, time: string): DayAppointment[] {
    if (!day) {
      return [];
    }
    return (this.appointmentsByDay[day.iso] || []).filter(appointment => appointment.time === time);
  }

  getAppointmentsByDay(day: CalendarDay): DayAppointment[] {
    return this.appointmentsByDay[day.iso] || [];
  }

  normalizeDate(date: string): string {
    return date ? date.split('T')[0] : '';
  }

  initials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    return `${parts[0]?.charAt(0) ?? '-'}${parts[1]?.charAt(0) ?? ''}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }

  confirmModalAction(): void {
    this.confirmDialog.onConfirm?.();
  }

  closeConfirmModal(): void {
    this.resetConfirmModal();
  }

  private resetConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmDialog = {
      title: '',
      message: '',
      actionLabel: 'Confirmar',
      tone: 'default',
      pending: false,
      onConfirm: null,
    };
  }

  private openConfirmModal(config: Omit<ConfirmDialogState, 'pending'>): void {
    this.confirmDialog = {
      ...config,
      pending: false,
    };
    this.showConfirmModal = true;
  }

  private loadAppointments(): void {
    const token = this.authService.getToken();
    const range = this.currentRange;
    if (!token || !range) {
      return;
    }

    this.reservasApiService.getAppointmentsInRange(range.start, range.end, token).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.dayAppointments = appointments.map(appointment => ({
          id: appointment.id,
          time: appointment.startTime.substring(0, 5),
          name: appointment.guestName || 'Reserva',
          appointmentDate: this.normalizeDate(appointment.appointmentDate),
        }));
        this.groupAppointments();
        this.fillMonthAppointments();
        this.cdr.detectChanges();
      },
      error: () => {
        this.appointments = [];
        this.dayAppointments = [];
        this.appointmentsByDay = {};
      },
    });
  }

  private loadBlockedSlots(): void {
    const token = this.authService.getToken();
    const range = this.currentRange;
    if (!token || !range) {
      return;
    }

    this.reservasApiService.getBlockedSlotsInRange(range.start, range.end, token).subscribe({
      next: (slots) => {
        this.blockedSlots = slots;
        this.rebuildBlockedLookups();
        this.cdr.detectChanges();
      },
      error: () => {
        this.blockedSlots = [];
        this.rebuildBlockedLookups();
      },
    });
  }

  private loadWorkingDays(): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.reservasApiService.getWorkingDays(token).subscribe({
      next: (response) => {
        this.workingDays = new Set(response.workingDays ?? []);
        this.workingDaysDraft = new Set(this.workingDays);
        this.morningStart = this.toHourMinute(response.morningStart || '10:00');
        this.morningEnd = this.toHourMinute(response.morningEnd || '13:45');
        this.afternoonStart = response.afternoonStart ? this.toHourMinute(response.afternoonStart) : '';
        this.afternoonEnd = response.afternoonEnd ? this.toHourMinute(response.afternoonEnd) : '';
        this.timeSlots = this.buildTimeSlots();
        this.refreshCalendarView();
        this.cdr.detectChanges();
      },
      error: () => {
        this.workingDays = new Set<DayOfWeek>();
        this.workingDaysDraft = new Set<DayOfWeek>();
        this.timeSlots = this.buildDefaultTimeSlots();
      },
    });
  }

  private loadUsers(): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.reservasApiService.getUsers(token).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => {
        this.users = [];
      },
    });
  }

  private loadBookingOccupiedTimes(): void {
    const token = this.authService.getToken();
    if (!token || !this.bookingDate) {
      this.bookingOccupiedTimes.clear();
      return;
    }

    this.reservasApiService.getOccupiedSlots(this.bookingDate, token).subscribe({
      next: (times) => {
        this.bookingOccupiedTimes = new Set((times ?? []).map(time => this.toHourMinute(time)));
        if (this.bookingTime && this.isBookingSlotUnavailable(this.bookingTime)) {
          this.bookingTime = '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.bookingOccupiedTimes.clear();
      },
    });
  }

  private groupAppointments(): void {
    const grouped: Record<string, DayAppointment[]> = {};
    for (const appointment of this.dayAppointments) {
      grouped[appointment.appointmentDate] ??= [];
      grouped[appointment.appointmentDate].push(appointment);
    }
    this.appointmentsByDay = grouped;
  }

  private fillMonthAppointments(): void {
    if (this.viewMode !== 'month') {
      return;
    }

    this.monthDays = this.monthDays.map(day => ({
      ...day,
      appointments: this.appointments.filter(appointment => this.normalizeDate(appointment.appointmentDate) === day.iso),
    }));
  }

  private rebuildBlockedLookups(): void {
    this.blockedByDate.clear();
    for (const slot of this.blockedSlots) {
      const entry = this.blockedByDate.get(slot.blockedDate) ?? { allDay: false, intervals: [] as Array<[number, number]> };
      if (slot.allDay) {
        entry.allDay = true;
      } else if (slot.startTime && slot.endTime) {
        entry.intervals.push([this.toMinutes(slot.startTime), this.toMinutes(slot.endTime)]);
      }
      this.blockedByDate.set(slot.blockedDate, entry);
    }
  }

  private buildTimeSlots(): string[] {
    const slots = [
      ...this.buildSlotsForRange(this.morningStart, this.morningEnd),
      ...this.buildSlotsForRange(this.afternoonStart, this.afternoonEnd),
    ];

    return slots.length > 0 ? Array.from(new Set(slots)) : this.buildDefaultTimeSlots();
  }

  private buildDefaultTimeSlots(): string[] {
    return [
      ...this.buildSlotsForRange('10:00', '13:45'),
      ...this.buildSlotsForRange('15:00', '18:00'),
    ];
  }

  private buildSlotsForRange(start: string, end: string): string[] {
    if (!start || !end) {
      return [];
    }

    const startMinutes = this.toMinutes(start);
    const endMinutes = this.toMinutes(end);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || startMinutes >= endMinutes) {
      return [];
    }

    const slots: string[] = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
      const minute = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
    return slots;
  }

  private isPastDate(isoDate: string): boolean {
    const today = this.toLocalDate(new Date());
    return isoDate < today;
  }

  private isPastDateTime(isoDate: string, time: string): boolean {
    if (!isoDate || !time) {
      return false;
    }

    const now = new Date();
    const selected = new Date(`${isoDate}T${this.appendSeconds(time)}`);
    return selected.getTime() < now.getTime();
  }

  private appendSeconds(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
  }

  private getApiErrorMessage(error: any, fallback: string): string {
    const payload = error?.error;
    if (payload?.message) {
      return payload.message;
    }
    if (payload && typeof payload === 'object') {
      const firstMessage = Object.values(payload).find(value => typeof value === 'string');
      if (firstMessage) {
        return firstMessage as string;
      }
    }
    return fallback;
  }

  private toHourMinute(time: string): string {
    return time.substring(0, 5);
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toMinutes(time: string): number {
    const hh = parseInt(time.slice(0, 2), 10);
    const mm = parseInt(time.slice(3, 5), 10);
    return hh * 60 + mm;
  }

  private isQuarterHour(time: string): boolean {
    return this.toMinutes(time) % 15 === 0;
  }

  private isTimeInsideLimits(time: string, min: string, max: string): boolean {
    const minutes = this.toMinutes(time);
    return minutes >= this.toMinutes(min) && minutes <= this.toMinutes(max);
  }

  private refreshCalendarView(): void {
    if (this.viewMode === 'month') {
      this.buildMonth();
      return;
    }

    this.updateCalendar();
  }

  private selectTodayInCurrentWeek(): void {
    const today = this.todayIso;
    const todayInCurrentWeek = this.calendarDays.find(day => day.iso === today);
    if (todayInCurrentWeek) {
      this.selectedDay = todayInCurrentWeek;
    }
  }

  private moveSelectedDay(dayOffset: number): void {
    const base = new Date(`${this.selectedDay?.iso || this.todayIso}T00:00:00`);
    base.setDate(base.getDate() + dayOffset);
    const targetIso = this.toLocalDate(base);

    this.currentWeekOffset = this.getWeekOffsetFromToday(base);
    this.updateCalendar();
    this.selectedDay = this.calendarDays.find(day => day.iso === targetIso) || this.selectedDay;
  }

  private getWeekOffsetFromToday(date: Date): number {
    const currentWeekStart = this.getWeekStart(new Date());
    const targetWeekStart = this.getWeekStart(date);
    const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.round((targetWeekStart.getTime() - currentWeekStart.getTime()) / millisecondsPerWeek);
  }

  private getWeekStart(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
