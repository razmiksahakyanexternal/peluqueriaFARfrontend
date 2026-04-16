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
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

 ngOnInit(): void {
   
     if (this.authService.isLoggedIn()) {
      this.router.navigate(['/registro']);
    }
  }

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (form.invalid) {
      return;
    }

    const payload: RegisterRequest = {
      name: form.value.nombre,
      surname: form.value.apellidos,
      email: form.value.email,
      password: form.value.password,
      mobilePhone: form.value.telefono ?? ''
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.successMessage = 'Cuenta creada correctamente. Redirigiendo al inicio...';
        this.authService.saveToken(response.token);
        this.authService.saveRole(response.role);
        if (response.name) {
          this.authService.saveName(response.name);
        }
        if (response.surname) {
          this.authService.saveSurname(response.surname);
        }
        setTimeout(() => this.router.navigate(['/inicio-sesion']), 1200);
      },
      error: (err) => {
        if (err?.error && typeof err.error === 'object') {
          const errors = Object.values(err.error).join('. ');
          this.errorMessage = errors || 'Error al registrar. Intenta nuevamente.';
        } else {
          this.errorMessage = err?.error?.message || 'Error al registrar. Intenta nuevamente.';
        }
      }
    });
  }
}
