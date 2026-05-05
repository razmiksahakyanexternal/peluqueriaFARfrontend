import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateAppointmentRequest {
	appointmentDate: string; // formato YYYY-MM-DD
	startTime: string; // formato HH:mm:ss
	guestName?: string;
	guestPhone?: string;
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

export interface AppointmentItem {
	id: number;
	appointmentDate: string;
	startTime: string;
	endTime: string;
	guestName?: string;
	guestPhone?: string;
}

export interface CreateBlockedSlotRequest {
	blockedDate: string; // formato YYYY-MM-DD
	allDay: boolean;
	startTime?: string; // formato HH:mm:ss si allDay=false
	endTime?: string; // formato HH:mm:ss si allDay=false
}

export interface BlockedSlotItem {
	id: number;
	blockedDate: string;
	allDay: boolean;
	startTime?: string | null;
	endTime?: string | null;
}
@Injectable({
	providedIn: 'root'
})
export class ReservasApiService {
	private readonly baseUrl = 'http://localhost:8081/appointments';
	private readonly usersUrl = 'http://localhost:8081/users';
	private readonly blockedSlotsUrl = 'http://localhost:8081/barber/blocked-slots';

	constructor(private http: HttpClient) {}

	createAppointment(payload: CreateAppointmentRequest, token: string): Observable<CreateAppointmentResponse> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.post<CreateAppointmentResponse>(this.baseUrl, payload, { headers });
	}

	getOccupiedSlots(appointmentDate: string, token: string): Observable<string[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<string[]>(`${this.baseUrl}/occupied`, {
			headers,
			params: { date: appointmentDate },
		});
	}

	getMyAppointments(token: string): Observable<AppointmentItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<AppointmentItem[]>(`${this.baseUrl}/my`, { headers });
	}

	getAppointmentsInRange(start: string, end: string, token: string): Observable<AppointmentItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<AppointmentItem[]>(`${this.baseUrl}/range`, {
			headers,
			params: { start, end },
		});
	}

	getUsers(token: string): Observable<UserItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<UserItem[]>(this.usersUrl, { headers });
	}

	createBlockedSlot(payload: CreateBlockedSlotRequest, token: string): Observable<BlockedSlotItem> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.post<BlockedSlotItem>(this.blockedSlotsUrl, payload, { headers });
	}

	updateBlockedSlot(id: number, payload: CreateBlockedSlotRequest, token: string): Observable<BlockedSlotItem> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.put<BlockedSlotItem>(`${this.blockedSlotsUrl}/${id}`, payload, { headers });
	}

	deleteBlockedSlot(id: number, token: string): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.delete<void>(`${this.blockedSlotsUrl}/${id}`, { headers });
	}

	getBlockedSlotsInRange(start: string, end: string, token: string): Observable<BlockedSlotItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<BlockedSlotItem[]>(`${this.blockedSlotsUrl}/range`, {
			headers,
			params: { start, end },
		});
	}
}

