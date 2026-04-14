import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  mobilePhone?: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  name?: string;
  surname?: string;
}

type UserRole = 'CLIENT' | 'BARBER' | 'ADMIN';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:8081/auth';
  private readonly tokenKey = 'peluqueria-far-token';
  private readonly roleKey = 'peluqueria-far-role';
  private readonly userNameKey = 'peluqueria-far-name';
  private readonly userSurnameKey = 'peluqueria-far-surname';

  constructor(private http: HttpClient) {}

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload);
  }

  login(payload: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  saveRole(role: string): void {
    localStorage.setItem(this.roleKey, role);
  }

  saveName(name: string): void {
    localStorage.setItem(this.userNameKey, name);
  }

  saveSurname(surname: string): void {
    localStorage.setItem(this.userSurnameKey, surname);
  }

  getName(): string | null {
    return localStorage.getItem(this.userNameKey);
  }

  getSurname(): string | null {
    return localStorage.getItem(this.userSurnameKey);
  }

  getFullName(): string {
    const name = this.getName();
    const surname = this.getSurname();
    return [name, surname].filter(Boolean).join(' ') || 'Usuario';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  getRedirectRouteByRole(): string {
    const role = this.getRole() as UserRole | null;

    switch (role) {
      case 'BARBER':
        return '/peluquero';
      case 'CLIENT':
      case 'ADMIN':
      default:
        return '/home';
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userNameKey);
    localStorage.removeItem(this.userSurnameKey);
  }
}
