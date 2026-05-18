import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { AppointmentResponse, ReservasApiService } from '../reservas-api.service';
import { MisCitasComponent } from './mis-citas.component';

describe('MisCitasComponent - CU-08 Cancelación de Cita (Cliente)', () => {
  let component: MisCitasComponent;
  let fixture: ComponentFixture<MisCitasComponent>;
  let authMock: any;
  let apiMock: any;
  let routerMock: any;

  const futureAppointment: AppointmentResponse = {
    id: 10,
    guestName: 'Razmik Sahakyan',
    appointmentDate: '2027-05-05',
    startTime: '10:00:00',
    endTime: '10:15:00',
  };

  beforeEach(async () => {
    authMock = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      getToken: vi.fn().mockReturnValue('token123'),
    };

    apiMock = {
      getMyAppointments: vi.fn().mockReturnValue(of([futureAppointment])),
      deleteAppointment: vi.fn().mockReturnValue(of(void 0)),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [MisCitasComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisCitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deberia crear el componente y cargar las citas del cliente', () => {
    expect(component).toBeTruthy();
    expect(apiMock.getMyAppointments).toHaveBeenCalledWith('token123');
    expect(component.appointments).toEqual([futureAppointment]);
  });

  it('deberia abrir el modal de confirmacion al seleccionar una cita futura', () => {
    component.cancelarCita(futureAppointment.id);

    expect(component.confirmAppointmentId).toBe(futureAppointment.id);
    expect(apiMock.deleteAppointment).not.toHaveBeenCalled();
  });

  it('deberia cancelar la cita y eliminarla completamente de la lista', () => {
    component.cancelarCita(futureAppointment.id);
    component.confirmarCancelacion();

    expect(apiMock.deleteAppointment).toHaveBeenCalledWith(futureAppointment.id, 'token123');
    expect(component.appointments).toEqual([]);
    expect(component.successMessage).toBe('Cita cancelada correctamente.');
    expect(component.confirmAppointmentId).toBeNull();
    expect(component.deletingAppointmentId).toBeNull();
  });

  it('deberia dejar la cita en la lista si el backend devuelve error', () => {
    apiMock.deleteAppointment.mockReturnValue(
      throwError(() => ({ error: { message: 'No se pudo cancelar' } })),
    );

    component.cancelarCita(futureAppointment.id);
    component.confirmarCancelacion();

    expect(apiMock.deleteAppointment).toHaveBeenCalledWith(futureAppointment.id, 'token123');
    expect(component.appointments).toEqual([futureAppointment]);
    expect(component.errorMessage).toBe('No se pudo cancelar');
    expect(component.deletingAppointmentId).toBeNull();
  });

  it('no deberia cancelar si no hay cita confirmada en el modal', () => {
    component.confirmAppointmentId = null;

    component.confirmarCancelacion();

    expect(apiMock.deleteAppointment).not.toHaveBeenCalled();
  });

  it('deberia cerrar el modal de cancelacion si no esta borrando', () => {
    component.confirmAppointmentId = futureAppointment.id;

    component.cerrarModalCancelacion();

    expect(component.confirmAppointmentId).toBeNull();
  });

  it('deberia navegar al inicio', () => {
    component.volverAlInicio();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('deberia redirigir al login si el cliente no esta autenticado', async () => {
    authMock.isLoggedIn.mockReturnValue(false);

    const unauthenticatedFixture = TestBed.createComponent(MisCitasComponent);
    unauthenticatedFixture.detectChanges();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/inicio-sesion']);
  });
});
