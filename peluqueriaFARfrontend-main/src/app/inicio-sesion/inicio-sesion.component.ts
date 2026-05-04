import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css'],
  standalone: false
})
export class InicioSesionComponent implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
      this.router.navigate(['/home']);
      return;
    }

    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.errorMessage = decodeURIComponent(error);
    }

    const verificationSent = this.route.snapshot.queryParamMap.get('verificationSent');
    if (verificationSent === 'true') {
      this.successMessage = 'Se ha mandado un correo de verificación de la cuenta, si esta existe.';
    }

    const verified = this.route.snapshot.queryParamMap.get('verified');
    if (verified === 'true') {
      this.successMessage = 'Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja el login con email y contraseña
   */
  loginWithEmail(): void {
    console.log('loginWithEmail start', { email: this.email });
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.errorMessage = '';

    this.authService.checkEmail(this.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = true;
          this.authService.login(this.email, this.password)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe({
              next: () => {
                this.router.navigate(['/home']);
              },
              error: (error) => {
                console.error('Error en login:', error);
                this.errorMessage = this.getErrorMessage(error);
                this.errorMessage = this.errorMessage || 'Error en el inicio de sesión';
              }
            });
        },
        error: (error) => {
          console.error('Error en check-email:', error);
          this.errorMessage = this.getErrorMessage(error);
          this.errorMessage = this.errorMessage || 'Error en el inicio de sesión';
        }
      });
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'Error al iniciar sesión';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Comprueba que el backend está en ejecución.';
    }

    if (error.error) {
      if (typeof error.error === 'string') {
        try {
          const parsed = JSON.parse(error.error);
          return parsed.message || String(error.error);
        } catch {
          return error.error;
        }
      }
      if (typeof error.error.message === 'string') {
        return error.error.message;
      }
      if (typeof error.error === 'object') {
        return error.error.message || JSON.stringify(error.error);
      }
    }

    if (typeof error.message === 'string') {
      return error.message;
    }

    return 'Error al iniciar sesión';
  }

  /**
   * Redirige al backend para iniciar sesión con Google.
   */
  loginWithGoogle(): void {
    this.errorMessage = '';
    this.authService.redirectToGoogleLogin();
  }
}

