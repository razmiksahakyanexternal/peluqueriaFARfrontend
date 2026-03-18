import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioSesionComponent } from './inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './registro/registro.component';
import { HomeComponent } from './home/home.component';
import { PeluqueroComponent } from './peluquero/peluquero.component';
import { ReservasComponent } from './reservas/reservas.component';

const routes: Routes = [
  // Route that shows the homepage (usable for visitors or logged in users)
  { path: '', pathMatch: 'full', redirectTo: 'inicio-sesion' },
  { path: 'home', component: HomeComponent },
  { path: 'peluquero', component: PeluqueroComponent },
  { path: 'reservas', component: ReservasComponent },
  { path: 'inicio-sesion', component: InicioSesionComponent },
  { path: 'registro', component: RegistroComponent },
  { path: '**', redirectTo: 'inicio-sesion' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
