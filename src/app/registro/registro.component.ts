import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  standalone: false
})
export class RegistroComponent {
  submitted = false;

  onSubmit(form: NgForm): void {
    this.submitted = true;
    if (form.invalid) {
      return;
    }

    // Placeholder: when backend integration is ready, call register service here.
    console.log('Registro valido, listo para enviar');
  }
}
