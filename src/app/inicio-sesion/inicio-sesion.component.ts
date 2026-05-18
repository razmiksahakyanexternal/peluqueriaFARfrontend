import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrl: './inicio-sesion.component.css',
  standalone: false,
})
export class InicioSesionComponent implements OnInit {
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.saveToken(token);
      const role = this.route.snapshot.queryParamMap.get('role');
      const name = this.route.snapshot.queryParamMap.get('name');
      const surname = this.route.snapshot.queryParamMap.get('surname');
      if (role) {
        this.authService.saveRole(role);
      }
      if (name) {
        this.authService.saveName(name);
      }
      if (surname) {
        this.authService.saveSurname(surname);
      }
      this.router.navigate([this.authService.getRedirectRouteByRole()]);
      return;
    }

    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.errorMessage = decodeURIComponent(error);
    }

    if (this.route.snapshot.queryParamMap.get('verificationSent') === 'true') {
      this.successMessage = 'Se ha enviado el correo de verificación. Revisa tu bandeja de entrada.';
    }

    if (this.route.snapshot.queryParamMap.get('verified') === 'true') {
      this.successMessage = 'Tu cuenta ha sido verificada. Ya puedes iniciar sesión.';
    }

    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getRedirectRouteByRole()]);
    }
  }

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    const emailControl = form.controls['email'];
    const passwordControl = form.controls['password'];

    if (emailControl?.invalid || passwordControl?.errors?.['required']) {
      return;
    }

    this.authService
      .login({
        email: (form.value.email ?? '').trim(),
        password: (form.value.password ?? '').trim(),
      })
      .subscribe({
        next: (response) => {
          const token = this.authService.extractJwtToken(response);
          if (!token) {
            this.errorMessage = 'Login correcto, pero no se recibio token JWT.';
            this.cdr.detectChanges();
            return;
          }

          this.authService.saveToken(token);
          this.authService.saveRole(response.role);
          if (response.name) {
            this.authService.saveName(response.name);
          }
          if (response.surname) {
            this.authService.saveSurname(response.surname);
          }

          this.successMessage = 'Inicio de sesión exitoso.';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate([this.authService.getRedirectRouteByRole()]), 900);
        },
        error: (err) => {
          setTimeout(() => this.cdr.detectChanges());
          this.errorMessage = err?.error?.message || 'Email o contraseña incorrectos.';
        },
      });
  }

  loginWithGoogle(): void {
    this.errorMessage = null;
    this.authService.redirectToGoogleLogin();
  }
}
