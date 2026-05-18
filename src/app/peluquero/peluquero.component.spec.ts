import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { CreateAppointmentResponse, ReservasApiService } from '../reservas-api.service';
import { PeluqueroComponent } from './peluquero.component';

describe('PeluqueroComponent - CU-06 y CU-07', () => {
  let component: PeluqueroComponent;
  let fixture: ComponentFixture<PeluqueroComponent>;
  let authMock: any;
  let apiMock: any;
  let routerMock: any;

  const mockResponse: CreateAppointmentResponse = {
    id: 1,
    message: 'ok',
    appointmentDate: '2027-05-05',
    startTime: '16:00:00',
    endTime: '16:15:00',
    guestName: 'Juan',
  };

  beforeEach(async () => {
    authMock = {
      getToken: vi.fn().mockReturnValue('token123'),
      getName: vi.fn().mockReturnValue('Razmik'),
      getSurname: vi.fn().mockReturnValue('Sahakyan'),
    };

    apiMock = {
      createAppointment: vi.fn(),
      getAppointmentsInRange: vi.fn().mockReturnValue(of([])),
      getBlockedSlotsInRange: vi.fn().mockReturnValue(of([])),
      getWorkingDays: vi.fn().mockReturnValue(of({
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        morningStart: '08:00:00',
        morningEnd: '13:45:00',
        afternoonStart: '15:00:00',
        afternoonEnd: '20:15:00',
      })),
      getOccupiedSlots: vi.fn().mockReturnValue(of([])),
      getUsers: vi.fn().mockReturnValue(of([])),
      searchUsers: vi.fn().mockReturnValue(of([])),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PeluqueroComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PeluqueroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('CU-06 - Cliente no registrado', () => {
    it('error si falta fecha', () => {
      component.clientType = 'unregistered';
      component.bookingDate = '';
      component.bookingTime = '10:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.dateError).toBe('La fecha es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si falta hora', () => {
      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si falta nombre', () => {
      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.guestName = '';

      component.bookAppointment();

      expect(component.guestNameError).toBe('El nombre del cliente es obligatorio');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si el telefono tiene letras', () => {
      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';
      component.guestPhone = 'abc123';

      component.bookAppointment();

      expect(component.bookingErrorMessage).toBe(
        'El teléfono debe contener solo números y tener como máximo 9 dígitos',
      );
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('crea cita correctamente', () => {
      apiMock.createAppointment.mockReturnValue(of(mockResponse));

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';
      component.guestPhone = '666777888';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalledWith(
        {
          appointmentDate: '2027-05-05',
          startTime: '16:00:00',
          guestName: 'Juan',
          guestPhone: '666777888',
          userId: undefined,
        },
        'token123',
      );
      expect(component.bookingSuccessMessage).toBe('Cita reservada correctamente');
    });

    it('muestra error del backend', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: { message: 'Error al crear cita' } })),
      );

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.bookingErrorMessage).toBe('Error al crear cita');
      expect(component.isBookingAppointment).toBeFalsy();
    });

    it('no crea cita si la hora ya esta ocupada', () => {
      component.bookingOccupiedTimes = new Set(['10:00']);
      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.timeError).toBe('Esta hora ya tiene una cita');
      expect(component.bookingErrorMessage).toBe('Ya existe una cita en esa franja horaria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });
  });

  describe('CU-07 - Cliente registrado', () => {
    it('error si falta fecha', () => {
      component.clientType = 'registered';
      component.bookingDate = '';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(component.dateError).toBe('La fecha es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si falta hora', () => {
      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si no selecciona cliente', () => {
      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = null;

      component.bookAppointment();

      expect(component.guestNameError).toBe('Selecciona un cliente de la lista');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('crea cita correctamente', () => {
      apiMock.createAppointment.mockReturnValue(of(mockResponse));

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;
      component.guestName = 'Juan Perez';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalledWith(
        {
          appointmentDate: '2027-05-05',
          startTime: '16:00:00',
          guestName: 'Juan Perez',
          guestPhone: undefined,
          userId: 1,
        },
        'token123',
      );
    });

    it('muestra error del backend', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: { message: 'Error al reservar cita' } })),
      );

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;
      component.guestName = 'Juan Perez';

      component.bookAppointment();

      expect(component.bookingErrorMessage).toBe('Error al reservar cita');
      expect(component.isBookingAppointment).toBeFalsy();
    });

    it('no crea cita si la hora ya esta ocupada', () => {
      component.bookingOccupiedTimes = new Set(['10:00']);
      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.selectedUserId = 1;
      component.guestName = 'Juan Perez';

      component.bookAppointment();

      expect(component.timeError).toBe('Esta hora ya tiene una cita');
      expect(component.bookingErrorMessage).toBe('Ya existe una cita en esa franja horaria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });
  });
});
