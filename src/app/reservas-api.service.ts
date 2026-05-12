import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateAppointmentRequest {
	appointmentDate: string; // formato YYYY-MM-DD
	startTime: string; // formato HH:mm:ss
	guestName?: string;
	guestPhone?: string;
}

export interface UserItem {
	id: number;
	name: string;
	surname: string;
	email: string;
}

export interface CreateAppointmentResponse {
	id: number;
	message: string;
	appointmentDate: string;
	startTime: string;
	endTime: string;
	guestName?: string;
}

export interface AppointmentResponse {
	id: number;
	guestName: string;
	guestPhone?: string;
	appointmentDate: string;
	startTime: string;
	endTime: string;
}

@Injectable({
	providedIn: 'root'
})
export class ReservasApiService {
	private readonly baseUrl = 'http://localhost:8081/appointments';
	private readonly usersUrl = 'http://localhost:8081/users';

	constructor(private http: HttpClient) {}

	private getHeaders(token: string): HttpHeaders {
		return new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
	}

	createAppointment(payload: CreateAppointmentRequest, token: string): Observable<CreateAppointmentResponse> {
		return this.http.post<CreateAppointmentResponse>(this.baseUrl, payload, { 
			headers: this.getHeaders(token)
		});
	}
	getUsers(token: string): Observable<UserItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<UserItem[]>(this.usersUrl, { headers });
	}

	searchUsers(query: string, token: string): Observable<UserItem[]> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.get<UserItem[]>(`${this.usersUrl}/search`, {
			headers,
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

	getAppointmentsInRange(start: string, end: string, token: string): Observable<AppointmentResponse[]> {
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
}

