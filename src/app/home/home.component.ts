import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: false
})
export class HomeComponent {
  constructor(public authService: AuthService, private router: Router) {}

  get userName(): string {
    return this.authService.getFullName();
  }

  reservarCita(): void {
    this.router.navigate(['/reservas']);
  }

  verMisCitas(): void {
    this.router.navigate(['/mis-citas']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }
}
