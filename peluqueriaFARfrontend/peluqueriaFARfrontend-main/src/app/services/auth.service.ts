import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  jwtToken: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión con email y contraseña (mantiene compatibilidad con backend)
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.saveToken(response.jwtToken);
      })
    );
  }

  checkEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/check-email`, { email });
  }

  /**
   * Redirige al backend para iniciar sesión con Google.
   */
  redirectToGoogleLogin(): void {
    window.location.href = `${this.apiUrl}/google/login`;
  }

  /**
   * Registra un nuevo usuario
   */
  register(name: string, surname: string, email: string, mobilePhone: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, {
      name,
      surname,
      email,
      mobilePhone,
      password
    });
  }

  /**
   * Obtiene el token JWT del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Guarda el token JWT en localStorage
   */
  private saveToken(token: string): void {
    localStorage.setItem('jwtToken', token);
  }

  /**
   * Elimina el token JWT del localStorage (logout)
   */
  logout(): void {
    localStorage.removeItem('jwtToken');
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
