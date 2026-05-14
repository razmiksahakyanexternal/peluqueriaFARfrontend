import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateAppointmentRequest {
  appointmentDate: string;
  startTime: string;
  guestName?: string;
  guestPhone?: string;
  userId?: number | null;
}

export interface CreateAppointmentResponse {
  id: number;
  message: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  guestName?: string;
}

export interface UserItem {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface AppointmentResponse {
  id: number;
  guestName: string;
  guestPhone?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

export type AppointmentItem = AppointmentResponse;

export interface CreateBlockedSlotRequest {
  blockedDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface BlockedSlotItem {
  id: number;
  blockedDate: string;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface WorkingDaysResponse {
  workingDays: DayOfWeek[];
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
}

export interface WorkingDaysRequest {
  workingDays: DayOfWeek[];
  morningStart: string;
  morningEnd: string;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasApiService {
  private readonly baseUrl = 'http://localhost:8081/appointments';
  private readonly usersUrl = 'http://localhost:8081/users';
  private readonly blockedSlotsUrl = 'http://localhost:8081/barber/blocked-slots';
  private readonly workingDaysUrl = 'http://localhost:8081/barber/working-days';

  constructor(private http: HttpClient) {}

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createAppointment(
    payload: CreateAppointmentRequest,
    token: string,
  ): Observable<CreateAppointmentResponse> {
    return this.http.post<CreateAppointmentResponse>(this.baseUrl, payload, {
      headers: this.getHeaders(token),
    });
  }

  getUsers(token: string): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(this.usersUrl, {
      headers: this.getHeaders(token),
    });
  }

  searchUsers(query: string, token: string): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(`${this.usersUrl}/search`, {
      headers: this.getHeaders(token),
      params: { q: query },
    });
  }

  getOccupiedSlots(appointmentDate: string, token: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/occupied`, {
      headers: this.getHeaders(token),
      params: { date: appointmentDate },
    });
  }

  getMyAppointments(token: string): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.baseUrl}/my`, {
      headers: this.getHeaders(token),
    });
  }

  getAppointmentsInRange(
    start: string,
    end: string,
    token: string,
  ): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.baseUrl}/range`, {
      headers: this.getHeaders(token),
      params: { start, end },
    });
  }

  deleteAppointment(id: number, token: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(token),
    });
  }

  createBlockedSlot(payload: CreateBlockedSlotRequest, token: string): Observable<BlockedSlotItem> {
    return this.http.post<BlockedSlotItem>(this.blockedSlotsUrl, payload, {
      headers: this.getHeaders(token),
    });
  }

  updateBlockedSlot(
    id: number,
    payload: CreateBlockedSlotRequest,
    token: string,
  ): Observable<BlockedSlotItem> {
    return this.http.put<BlockedSlotItem>(`${this.blockedSlotsUrl}/${id}`, payload, {
      headers: this.getHeaders(token),
    });
  }

  deleteBlockedSlot(id: number, token: string): Observable<void> {
    return this.http.delete<void>(`${this.blockedSlotsUrl}/${id}`, {
      headers: this.getHeaders(token),
    });
  }

  getBlockedSlotsInRange(start: string, end: string, token: string): Observable<BlockedSlotItem[]> {
    return this.http.get<BlockedSlotItem[]>(`${this.blockedSlotsUrl}/range`, {
      headers: this.getHeaders(token),
      params: { start, end },
    });
  }

  getWorkingDays(token: string): Observable<WorkingDaysResponse> {
    return this.http.get<WorkingDaysResponse>(this.workingDaysUrl, {
      headers: this.getHeaders(token),
    });
  }

  getReservationWorkingDays(token: string): Observable<WorkingDaysResponse> {
    return this.http.get<WorkingDaysResponse>(`${this.workingDaysUrl}/reservation`, {
      headers: this.getHeaders(token),
    });
  }

  setWorkingDays(payload: WorkingDaysRequest, token: string): Observable<WorkingDaysResponse> {
    return this.http.put<WorkingDaysResponse>(
      this.workingDaysUrl,
      payload,
      { headers: this.getHeaders(token) },
    );
  }
}
