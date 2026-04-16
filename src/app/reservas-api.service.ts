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

@Injectable({
	providedIn: 'root',
})
export class ReservasApiService {
	private readonly baseUrl = 'http://localhost:8081/appointments';

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

	cancelAppointment(appointmentId: string, token: string): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
		return this.http.delete<void>(`${this.baseUrl}/${appointmentId}`, { headers });
	}
}

