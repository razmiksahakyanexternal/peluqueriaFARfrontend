import { Component } from '@angular/core';
<<<<<<< HEAD
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
=======
>>>>>>> ecd83d366b2769169e7dfaffaaa54ac9c4f81b0b

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: false
})
<<<<<<< HEAD
export class HomeComponent {
  constructor(private authService: AuthService, private router: Router) {}

  reservarCita(): void {
    this.router.navigate(['/reservas']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio-sesion']);
  }
}
=======
export class HomeComponent {}
>>>>>>> ecd83d366b2769169e7dfaffaaa54ac9c4f81b0b
