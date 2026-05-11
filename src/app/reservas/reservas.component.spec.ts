import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservasComponent } from './reservas.component';
<<<<<<< Updated upstream
=======
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ReservasApiService } from '../reservas-api.service';
import { of } from 'rxjs';
>>>>>>> Stashed changes

describe('ReservasComponent - CU-04 Consulta de disponibilidad', () => {

  // Componente que vamos a probar
  let component: ReservasComponent;

  // Fixture para acceder al componente y al HTML
  let fixture: ComponentFixture<ReservasComponent>;
<<<<<<< Updated upstream

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReservasComponent ]
    })
    .compileComponents();
=======

  // Mocks de servicios
  let routerMock: any;
  let authMock: any;
  let apiMock: any;

  beforeEach(async () => {

    // Mock del Router
    routerMock = {
      navigate: vi.fn()
    };

    // Mock del AuthService
    authMock = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      getToken: vi.fn().mockReturnValue('token123'),
      getFullName: vi.fn().mockReturnValue('Cliente Test')
    };

    // Mock del API de reservas
    apiMock = {
      getOccupiedSlots: vi.fn().mockReturnValue(of([]))
    };

    // Configuración del entorno de pruebas
    await TestBed.configureTestingModule({
      imports: [ReservasComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock }
      ]
    }).compileComponents();
>>>>>>> Stashed changes

    // Creación del componente
    fixture = TestBed.createComponent(ReservasComponent);
    component = fixture.componentInstance;
<<<<<<< Updated upstream
=======

    // Ejecuta ngOnInit()
>>>>>>> Stashed changes
    fixture.detectChanges();
  });

  /* ======================================================
      CU-04 Consulta de disponibilidad de horarios
  ====================================================== */

  // 1. CREACIÓN DEL COMPONENTE
  it('deberia crear el componente correctamente', () => {
    expect(component).toBeTruthy();
  });
<<<<<<< Updated upstream
});
=======

  // 2. VERIFICAR GENERACION DE HORAS
  it('deberia contener horarios disponibles de 15 minutos', () => {

    expect(component.availableHours.length).toBeGreaterThan(0);

    expect(component.availableHours).toContain('10:00');
    expect(component.availableHours).toContain('10:15');
    expect(component.availableHours).toContain('17:45');
  });

  // 3. VERIFICAR DETECCION DE DIA LABORABLE
  it('deberia detectar dias laborables correctamente', () => {

    const monday = new Date(2027, 4, 3); // Lunes

    component.currentDate = monday;

    expect(component.isWeekday(3)).toBe(true);
  });

  // 4. VERIFICAR DETECCION DE FIN DE SEMANA
  it('no deberia permitir sabados o domingos', () => {

    const sunday = new Date(2027, 4, 2); // Domingo

    component.currentDate = sunday;

    expect(component.isWeekday(2)).toBe(false);
  });

  // 5. SELECCION DE FECHA VALIDA
  it('deberia seleccionar una fecha valida', () => {

    component.currentDate = new Date(2027, 4, 1);

    component.selectDate(5);

    expect(component.selectedDate).not.toBeNull();
  });

  // 6. MARCAR HORA OCUPADA
  it('deberia marcar una hora como ocupada', () => {

    component.occupiedHours.add('10:00');

    expect(component.isTimeOccupied('10:00')).toBe(true);
  });

  // 7. NO PERMITIR SELECCION DE HORA OCUPADA
  it('no deberia permitir seleccionar hora ocupada', () => {

    component.occupiedHours.add('10:00');

    component.selectTime('10:00');

    expect(component.selectedTime).toBeNull();
  });

  // 8. VOLVER AL INICIO
  it('deberia navegar al inicio correctamente', () => {

    component.volverAlInicio();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});
>>>>>>> Stashed changes
