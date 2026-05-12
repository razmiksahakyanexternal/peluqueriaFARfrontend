import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ReservasApiService, AppointmentItem, UserItem, BlockedSlotItem, CreateBlockedSlotRequest, DayOfWeek } from '../reservas-api.service';

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
    private reservasApiService: ReservasApiService,
    private cdr: ChangeDetectorRef
  ) {}

  viewMode: 'day' | 'week' | 'month' = 'week';
  selectedDate = new Date();
  appointments: AppointmentItem[] = [];
  blockedSlots: BlockedSlotItem[] = [];
  private blockedByDate = new Map<string, { allDay: boolean; intervals: Array<[number, number]> }>();
  private blockedCellKeys = new Set<string>();
  users: UserItem[] = [];
  showBookingModal = false;
  showBlockModal = false;
  showWorkingDaysModal = false;

  // Booking form
  bookingDate = '';
  bookingTime = '';
  selectedUserId: number | null = null;
  guestName = '';
  guestPhone = '';
  bookingErrorMessage: string | null = null;
  bookingSuccessMessage: string | null = null;

  // Block form
  blockDate = '';
  blockAllDay = false;
  blockStartTime = '';
  blockEndTime = '';
  editingBlockedSlotId: number | null = null;
  blockSuccessMessage: string | null = null;
  blockErrorMessage: string | null = null;
  isBlocking = false;
  isDeletingBlockId: number | null = null;

  // Working days config
  workingDays = new Set<DayOfWeek>();
  workingDaysDraft = new Set<DayOfWeek>();
  workingDaysError: string | null = null;
  workingDaysSuccess: string | null = null;
  isSavingWorkingDays = false;

  get workingDaysText(): string {
    if (this.workingDays.size === 0) return '';
    const days = Array.from(this.workingDays);
    const names: Record<DayOfWeek, string> = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo'
    };
    return days.map(d => names[d]).join(', ');
  }

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
    this.loadBlockedSlots();
    this.loadUsers();
    this.loadWorkingDays();
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

    // Recalcular lookups por si el rango visible cambia
    this.rebuildBlockedLookups();
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get dayAppointments(): DayAppointment[] {
    const iso = this.toIsoDate(this.selectedDate);
    const apptsForDay = this.appointments.filter(a => a.appointmentDate === iso);
    const isTimeBlocked = (slot: string): boolean => this.isSlotBlocked(iso, slot);

    const byStartTime = new Map(apptsForDay.map(a => [a.startTime.slice(0, 5), a]));

    return this.timeSlots.map((slot) => {
      const appt = byStartTime.get(slot);
      if (appt) {
        return { time: slot, name: appt.guestName || 'Reserva', status: 'none' };
      }
      if (isTimeBlocked(slot)) {
        return { time: slot, name: 'Bloqueado', status: 'blocked' };
      }
      return { time: slot, name: '--', status: 'none' };
    });
  }

  get occupiedSlots(): number {
    return this.calendarEvents.filter(event => event.variant === 'cita').length;
  }

  get totalClients(): number {
    return this.dayAppointments.filter(appointment => appointment.name !== '--' && appointment.status !== 'blocked').length;
  }

  get occupancyPercent(): number {
    const total = this.timeSlots.length;
    return Math.round((this.occupiedSlots / total) * 100);
  }

  get formattedToday(): string {
    return 'Jueves, 18 Abril 2024';
  }

  get upcomingAppointments(): DayAppointment[] {
    return this.dayAppointments.filter(appointment => appointment.name !== '--' && appointment.status !== 'blocked');
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

  private loadBlockedSlots(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.blockedSlots = [];
      return;
    }

    const [start, end] = this.getRangeDates();
    this.reservasApiService.getBlockedSlotsInRange(start, end, token).subscribe({
      next: (slots: BlockedSlotItem[]) => {
        this.blockedSlots = slots;
        this.rebuildBlockedLookups();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar bloqueos:', error);
        this.blockedSlots = [];
        this.rebuildBlockedLookups();
        this.cdr.detectChanges();
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
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;
  }

  private loadWorkingDays(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.workingDays = new Set<DayOfWeek>();
      return;
    }

    this.reservasApiService.getWorkingDays(token).subscribe({
      next: (resp) => {
        this.workingDays = new Set(resp.workingDays ?? []);
        this.cdr.detectChanges();
      },
      error: () => {
        // Si no hay configuración aún, dejamos vacío y el peluquero lo configura.
        this.workingDays = new Set<DayOfWeek>();
        this.cdr.detectChanges();
      }
    });
  }

  openBlockModal(): void {
    this.showBlockModal = true;
    this.blockDate = this.toIsoDate(this.selectedDate);
    this.blockAllDay = false;
    this.blockStartTime = '';
    this.blockEndTime = '';
    this.editingBlockedSlotId = null;
    this.blockSuccessMessage = null;
    this.blockErrorMessage = null;
    this.isBlocking = false;
    this.isDeletingBlockId = null;
  }

  openWorkingDaysModal(): void {
    this.showWorkingDaysModal = true;
    this.workingDaysError = null;
    this.workingDaysSuccess = null;
    this.workingDaysDraft = new Set(this.workingDays);
  }

  closeWorkingDaysModal(): void {
    this.showWorkingDaysModal = false;
  }

  toggleWorkingDay(day: DayOfWeek, event: Event): void {
    const checked = (event.target as HTMLInputElement)?.checked;
    if (checked) {
      this.workingDaysDraft.add(day);
    } else {
      this.workingDaysDraft.delete(day);
    }
    this.cdr.detectChanges();
  }

  saveWorkingDays(): void {
    if (this.isSavingWorkingDays) return;

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

    this.isSavingWorkingDays = true;
    this.workingDaysError = null;
    this.workingDaysSuccess = null;

    this.reservasApiService.setWorkingDays(days, token).subscribe({
      next: (resp) => {
        this.workingDays = new Set(resp.workingDays ?? days);
        this.workingDaysDraft = new Set(this.workingDays);
        this.workingDaysSuccess = this.workingDays.size > 0 ? 'Días laborables actualizados' : 'Días laborables guardados';
        this.isSavingWorkingDays = false;
        this.cdr.detectChanges();
        setTimeout(() => this.closeWorkingDaysModal(), 700);
      },
      error: (err) => {
        this.workingDaysError = this.extractApiError(err, 'Error guardando días laborables');
        this.isSavingWorkingDays = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extractApiError(err: any, fallback: string): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }
    return err?.error?.message || err?.error?.error || fallback;
  }

  isNonWorkingDate(isoDate: string): boolean {
    if (this.workingDays.size === 0) return false;
    const dow = new Date(isoDate + 'T00:00:00').getDay(); // 0 Sun
    const map: DayOfWeek[] = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    return !this.workingDays.has(map[dow]);
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
  }

  get blockedSlotsForSelectedDate(): BlockedSlotItem[] {
    const iso = this.blockDate || this.toIsoDate(this.selectedDate);
    return this.blockedSlots.filter(b => b.blockedDate === iso);
  }

  editBlockedSlot(slot: BlockedSlotItem): void {
    this.showBlockModal = true;
    this.editingBlockedSlotId = slot.id;
    this.blockDate = slot.blockedDate;
    this.blockAllDay = slot.allDay;
    this.blockStartTime = slot.startTime ? slot.startTime.slice(0, 5) : '';
    this.blockEndTime = slot.endTime ? slot.endTime.slice(0, 5) : '';
  }

  deleteBlockedSlot(slot: BlockedSlotItem): void {
    const token = this.authService.getToken();
    if (!token) {
      alert('No autenticado');
      return;
    }

    if (this.isDeletingBlockId) {
      return;
    }

    this.blockSuccessMessage = null;
    this.blockErrorMessage = null;
    this.isDeletingBlockId = slot.id;

    this.reservasApiService.deleteBlockedSlot(slot.id, token).subscribe({
      next: () => {
        // Actualiza UI al instante para evitar sensación de "doble click"
        this.blockedSlots = this.blockedSlots.filter(b => b.id !== slot.id);
        this.rebuildBlockedLookups();
        this.blockSuccessMessage = 'Bloqueo eliminado';
        this.isDeletingBlockId = null;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al eliminar bloqueo:', error);
        this.blockErrorMessage = error.error?.message || 'Error desconocido';
        this.isDeletingBlockId = null;
        this.cdr.detectChanges();
      }
    });
  }

  blockSlot(): void {
    if (this.isBlocking) {
      return;
    }

    if (!this.blockDate) {
      this.blockErrorMessage = 'Selecciona fecha';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.blockErrorMessage = 'No autenticado';
      return;
    }

    const payload: CreateBlockedSlotRequest = {
      blockedDate: this.blockDate,
      allDay: this.blockAllDay
    };

    if (!this.blockAllDay) {
      if (!this.blockStartTime || !this.blockEndTime) {
        this.blockErrorMessage = 'Selecciona hora de inicio y fin';
        return;
      }
      payload.startTime = this.blockStartTime + ':00';
      payload.endTime = this.blockEndTime + ':00';
    }

    this.blockSuccessMessage = null;
    this.blockErrorMessage = null;
    this.isBlocking = true;

    const request$ = this.editingBlockedSlotId
      ? this.reservasApiService.updateBlockedSlot(this.editingBlockedSlotId, payload, token)
      : this.reservasApiService.createBlockedSlot(payload, token);

    request$.subscribe({
      next: (saved: BlockedSlotItem) => {
        const isEdit = this.editingBlockedSlotId != null;
        this.blockSuccessMessage = isEdit ? 'Bloqueo actualizado' : 'Bloqueo guardado';

        // Actualización optimista en memoria para que la UI responda al instante
        if (isEdit) {
          this.blockedSlots = this.blockedSlots.map(b => (b.id === saved.id ? saved : b));
        } else {
          this.blockedSlots = [...this.blockedSlots, saved].sort((a, b) => {
            const byDate = a.blockedDate.localeCompare(b.blockedDate);
            if (byDate !== 0) return byDate;
            const aStart = (a.startTime ?? '99:99:99');
            const bStart = (b.startTime ?? '99:99:99');
            return aStart.localeCompare(bStart);
          });
        }
        this.rebuildBlockedLookups();

        this.editingBlockedSlotId = null;
        this.isBlocking = false;

        // Form listo para crear otro bloqueo
        this.blockAllDay = false;
        this.blockStartTime = '';
        this.blockEndTime = '';
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al bloquear:', error);
        this.blockErrorMessage = error.error?.message || 'Error desconocido';
        this.isBlocking = false;
        this.cdr.detectChanges();
      }
    });
  }

  isSlotBlocked(isoDate: string, timeSlot: string): boolean {
    return this.blockedCellKeys.has(this.cellKey(isoDate, timeSlot));
  }

  isBookingTimeBlocked(timeSlot: string): boolean {
    if (!this.bookingDate || !timeSlot) return false;
    const entry = this.blockedByDate.get(this.bookingDate);
    if (!entry) return false;
    if (entry.allDay) return true;
    const slotStart = this.toMinutes(timeSlot);
    const slotEnd = slotStart + 15;
    return entry.intervals.some(([start, end]) => slotStart < end && slotEnd > start);
  }

  private rebuildBlockedLookups(): void {
    this.blockedByDate.clear();
    for (const slot of this.blockedSlots) {
      const dateKey = slot.blockedDate;
      const entry = this.blockedByDate.get(dateKey) ?? { allDay: false, intervals: [] as Array<[number, number]> };
      if (slot.allDay) {
        entry.allDay = true;
      } else if (slot.startTime && slot.endTime) {
        entry.intervals.push([this.toMinutes(slot.startTime), this.toMinutes(slot.endTime)]);
      }
      this.blockedByDate.set(dateKey, entry);
    }

    // Precompute cells for the visible week/month range to make rendering O(1)
    this.blockedCellKeys.clear();
    for (const day of this.weekDays) {
      const entry = this.blockedByDate.get(day.iso);
      if (!entry) continue;
      if (entry.allDay) {
        for (const ts of this.timeSlots) {
          this.blockedCellKeys.add(this.cellKey(day.iso, ts));
        }
        continue;
      }
      if (entry.intervals.length === 0) continue;
      for (const ts of this.timeSlots) {
        const slotMin = this.toMinutes(ts);
        const blocked = entry.intervals.some(([s, e]) => slotMin >= s && slotMin < e);
        if (blocked) this.blockedCellKeys.add(this.cellKey(day.iso, ts));
      }
    }
  }

  private toMinutes(time: string): number {
    const hh = parseInt(time.slice(0, 2), 10);
    const mm = parseInt(time.slice(3, 5), 10);
    return (hh * 60) + mm;
  }

  private cellKey(isoDate: string, timeSlot: string): string {
    return `${isoDate}|${timeSlot}`;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  bookAppointment(): void {
    this.bookingErrorMessage = null;
    this.bookingSuccessMessage = null;

    if (!this.bookingDate || !this.bookingTime) {
      this.bookingErrorMessage = 'Selecciona fecha y hora';
      return;
    }

    if (this.workingDays.size > 0 && this.isNonWorkingDate(this.bookingDate)) {
      this.bookingErrorMessage = 'No se puede reservar ese día porque está marcado como no laboral';
      return;
    }

    if (this.isBookingTimeBlocked(this.bookingTime)) {
      this.bookingErrorMessage = 'No se puede reservar una cita en un horario bloqueado';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.bookingErrorMessage = 'No autenticado';
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
      next: () => {
        this.bookingSuccessMessage = 'Cita reservada correctamente';
        this.bookingErrorMessage = null;
        this.loadAppointments(); // Reload appointments
        setTimeout(() => this.closeBookingModal(), 700);
      },
      error: (error) => {
        console.error('Error al reservar cita:', error);
        this.bookingErrorMessage = error.error?.message || 'Error al reservar cita. Verifica la fecha y vuelve a intentar.';
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
    this.loadBlockedSlots();
  }

  movePeriod(direction: 'prev' | 'next'): void {
    const days = this.viewMode === 'week' ? 7 : this.viewMode === 'month' ? 30 : 1;
    const multiplier = direction === 'next' ? 1 : -1;
    this.selectedDate = new Date(this.selectedDate.getTime() + days * 24 * 60 * 60 * 1000 * multiplier);
    this.buildWeekDays();
    this.loadAppointments();
    this.loadBlockedSlots();
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
