import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { InicioSesionComponent } from './inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './registro/registro.component';
import { HomeComponent } from './home/home.component';
<<<<<<< HEAD
import { PeluqueroComponent } from './peluquero/peluquero.component';
import { ReservasComponent } from './reservas/reservas.component';
=======
>>>>>>> ecd83d366b2769169e7dfaffaaa54ac9c4f81b0b

@NgModule({
  declarations: [
    App,
    InicioSesionComponent,
    RegistroComponent,
<<<<<<< HEAD
    HomeComponent,
    PeluqueroComponent,
    ReservasComponent
=======
    HomeComponent
>>>>>>> ecd83d366b2769169e7dfaffaaa54ac9c4f81b0b
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
