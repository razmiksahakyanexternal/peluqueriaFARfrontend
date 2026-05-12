import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-registro-exitoso',
  templateUrl: './registro-exitoso.component.html',
  styleUrls: ['./registro-exitoso.component.css'],
  standalone: false
})
export class RegistroExitosoComponent implements OnInit {
  message = 'Hemos enviado un correo de verificacion a tu email.';
  email: string | null = null;

  resendLoading = false;
  resendMessage: string | null = null;
  resendError: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const navigationState = window.history.state;
    const storedResponse = sessionStorage.getItem('registerSuccess');
    const fallbackState = storedResponse ? JSON.parse(storedResponse) : null;
    const response = navigationState?.message ? navigationState : fallbackState;

    if (!response) {
      return;
    }

    this.message = response.message ?? this.message;
    this.email = response.email ?? sessionStorage.getItem('registerEmail');
  }

  resendVerificationEmail(): void {
    if (!this.email || this.resendLoading) {
      return;
    }

    this.resendLoading = true;
    this.resendMessage = null;
    this.resendError = null;

    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (response) => {
        this.resendLoading = false;
        this.resendMessage = response?.message ?? 'Si la cuenta existe, se ha enviado un correo de verificacion.';
      },
      error: (error) => {
        this.resendLoading = false;
        this.resendError =
          error?.error?.message ??
          error?.message ??
          'No se pudo reenviar el correo. Intentalo de nuevo.';
      }
    });
  }
}
