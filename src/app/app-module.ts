import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { InicioSesionComponent } from './inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './registro/registro.component';
import { HomeComponent } from './home/home.component';
import { PeluqueroComponent } from './peluquero/peluquero.component';
import { ReservasComponent } from './reservas/reservas.component';
import { MisCitasComponent } from './mis-citas/mis-citas.component';

import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    App,
    InicioSesionComponent,
    RegistroComponent,
    HomeComponent,
    MisCitasComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
