import { ChangeDetectorRef, Component } from '@angular/core';
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
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

    this.isSubmitting = true;

    const payload: RegisterRequest = {
      name: form.value.nombre,
      surname: form.value.apellidos,
      email: form.value.email,
      password: form.value.password,
      ...(form.value.telefono?.trim() ? { mobilePhone: form.value.telefono.trim() } : {})
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Cuenta creada. Revisa tu correo para verificarla.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
        if (response.verificationEmailSent === false && response.verificationUrl) {
          this.successMessage = `${this.successMessage} En desarrollo puedes verificarla aqui: ${response.verificationUrl}`;
          this.cdr.detectChanges();
          return;
        }
        setTimeout(() => this.router.navigate(['/inicio-sesion'], { queryParams: { verificationSent: true } }), 1200);
      },
      error: (err) => {
        if (err?.status === 500) {
          this.errorMessage = null;
          this.isSubmitting = false;
          this.cdr.detectChanges();
          return;
        }

        if (err?.error && typeof err.error === 'object') {
          const errors = Object.values(err.error).join('. ');
          this.errorMessage = errors || 'Error al registrar. Intenta nuevamente.';
        } else {
          this.errorMessage = err?.error?.message || 'Error al registrar. Intenta nuevamente.';
        }
        if (this.errorMessage === 'El email ya está registrado') {
          this.errorMessage = 'Ya existe una cuenta asociada a este correo.';
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
