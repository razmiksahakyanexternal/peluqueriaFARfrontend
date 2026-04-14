import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  standalone: false
})
export class RegistroComponent {
  submitted = false;
  loading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = null;
    
    if (form.invalid) {
      return;
    }

    const { nombre, apellidos, email, telefono, password, confirmPassword } = form.value;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService.register(nombre, apellidos, email, telefono || '', password).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registro exitoso', response);
        // Redirigir a la página de inicio de sesión
        this.router.navigate(['/inicio-sesion']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en registro:', error);
        // Manejar diferentes tipos de errores
        if (error.error && typeof error.error === 'object') {
          if (error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.error.email) {
            this.errorMessage = error.error.email;
          } else {
            this.errorMessage = 'Error al registrar. Intenta de nuevo.';
          }
        } else {
          this.errorMessage = error.message || 'Error al registrar. Intenta de nuevo.';
        }
      }
    });
  }
}
