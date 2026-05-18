import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../auth.service';
import { ReservasApiService } from '../reservas-api.service';
import { ReservasComponent } from './reservas.component';

describe('ReservasComponent - CU-04 Consulta de disponibilidad', () => {
  let component: ReservasComponent;
  let fixture: ComponentFixture<ReservasComponent>;
  let routerMock: any;
  let authMock: any;
  let apiMock: any;

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn(),
    };

    authMock = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      getToken: vi.fn().mockReturnValue('token123'),
      getFullName: vi.fn().mockReturnValue('Cliente Test'),
    };

    apiMock = {
      getReservationWorkingDays: vi.fn().mockReturnValue(of({
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        morningStart: '10:00:00',
        morningEnd: '13:45:00',
        afternoonStart: '15:00:00',
        afternoonEnd: '18:00:00',
      })),
      getOccupiedSlots: vi.fn().mockReturnValue(of([])),
      getMyAppointments: vi.fn().mockReturnValue(of([])),
      createAppointment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReservasComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deberia crear el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('deberia cargar el horario de reservas desde la configuracion del peluquero', () => {
    expect(apiMock.getReservationWorkingDays).toHaveBeenCalledWith('token123');
    expect(component.availableHours.length).toBeGreaterThan(0);
    expect(component.availableHours).toContain('10:00');
    expect(component.availableHours).toContain('10:15');
    expect(component.availableHours).toContain('17:45');
  });

  it('deberia detectar dias laborables correctamente', () => {
    component.currentDate = new Date(2027, 4, 1);

    expect(component.isWeekday(3)).toBe(true); // Lunes 3 de mayo de 2027
  });

  it('no deberia permitir domingos si no estan configurados como laborables', () => {
    component.currentDate = new Date(2027, 4, 1);

    expect(component.isWeekday(2)).toBe(false); // Domingo 2 de mayo de 2027
  });

  it('deberia seleccionar una fecha valida', () => {
    component.currentDate = new Date(2027, 4, 1);

    component.selectDate(5);

    expect(component.selectedDate).not.toBeNull();
    expect(component.selectedDate?.getDate()).toBe(5);
  });

  it('deberia marcar una hora como ocupada', () => {
    component.occupiedHours.add('10:00');

    expect(component.isTimeOccupied('10:00')).toBe(true);
  });

  it('no deberia permitir seleccionar hora ocupada', () => {
    component.occupiedHours.add('10:00');

    component.selectTime('10:00');

    expect(component.selectedTime).toBeNull();
  });

  it('deberia navegar al inicio correctamente', () => {
    component.volverAlInicio();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});
