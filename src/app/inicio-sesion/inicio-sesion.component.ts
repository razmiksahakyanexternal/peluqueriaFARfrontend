import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrl: './inicio-sesion.component.css',
  standalone: false
})
export class InicioSesionComponent implements OnInit {
  submitted = false;
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

    this.authService
      .login({
        email: form.value.email,
        password: form.value.password,
      })
      .subscribe({
        next: (response) => {
          this.authService.saveToken(response.token);
          this.authService.saveRole(response.role);
          this.successMessage = 'Inicio de sesión exitoso.';
          setTimeout(() => this.router.navigate([this.authService.getRedirectRouteByRole()]), 1200);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Error iniciando sesión. Verifica tus credenciales.';
        },
      });
  }
}

