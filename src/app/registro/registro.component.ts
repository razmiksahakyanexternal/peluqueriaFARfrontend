import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  standalone: false
})
export class RegistroComponent implements OnInit {
  submitted = false;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

 ngOnInit(): void {
   
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getRedirectRouteByRole()]);
    }
  }

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (form.invalid) {
      return;
    }

    const { nombre, apellidos, email, telefono, password, confirmPassword } = form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    const payload: RegisterRequest = {
      name: nombre,
      surname: apellidos,
      email,
      password,
      mobilePhone: telefono ?? ''
    };

    this.loading = true;

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.loading = false;
        const state = { ...response, email };
        sessionStorage.setItem('registerEmail', email);
        sessionStorage.setItem('registerSuccess', JSON.stringify(state));
        this.router.navigate(['/registro-exitoso'], { state });
      },
      error: (err) => {
        this.loading = false;
        if (err?.error && typeof err.error === 'object') {
          this.errorMessage = err.error.message || err.error.email || Object.values(err.error).join('. ');
        } else {
          this.errorMessage = err?.error?.message || 'Error al registrar. Intenta nuevamente.';
        }
      }
    });
  }
}
