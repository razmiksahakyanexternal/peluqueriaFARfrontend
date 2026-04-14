import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject, throwError } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrl: './inicio-sesion.component.css',
  standalone: false
})
export class InicioSesionComponent implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja el login con email y contraseña
   */
  loginWithEmail(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorMessage = this.getErrorMessage(error);
          return throwError(() => error);
        }),
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
        }
      });
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'Error al iniciar sesión';
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

