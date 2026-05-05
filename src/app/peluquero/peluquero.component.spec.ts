import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeluqueroComponent } from './peluquero.component';
import { AuthService } from '../auth.service';
import { ReservasApiService, CreateAppointmentResponse } from '../reservas-api.service';
import { of, throwError } from 'rxjs';

describe('PeluqueroComponent - CU-06 y CU-07', () => {
  let component: PeluqueroComponent;
  let fixture: ComponentFixture<PeluqueroComponent>;

  let authMock: any;
  let apiMock: any;

  const mockResponse: CreateAppointmentResponse = {
    id: 1,
    message: 'ok',
    appointmentDate: '2026-05-05',
    startTime: '10:00',
    endTime: '10:30'
  };

  beforeEach(async () => {
    authMock = {
      getToken: vi.fn().mockReturnValue('token123')
    };

    apiMock = {
      createAppointment: vi.fn(),

      // 🔥 EVITA CRASHES EN ngOnInit
      getAppointmentsInRange: vi.fn().mockReturnValue(of([])),
      getUsers: vi.fn().mockReturnValue(of([])),
      searchUsers: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PeluqueroComponent], // ✔ standalone correcto
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeluqueroComponent);
    component = fixture.componentInstance;

    // ✔ evita problemas de init inesperados
    fixture.detectChanges();
  });

  /* =========================
      CU-06 Reserva de Cita cliente no registrado (Peluquero) 
  ========================= */

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
      component.bookingDate = '2026-05-05';
      component.bookingTime = '';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si falta nombre', () => {
      component.clientType = 'unregistered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '10:00';
      component.guestName = '';

      component.bookAppointment();

      expect(component.guestNameError)
        .toBe('Debes introducir el nombre del cliente');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('crea cita correctamente', () => {
      apiMock.createAppointment.mockReturnValue(of(mockResponse));

      component.clientType = 'unregistered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });

    it('error backend', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => new Error('error'))
      );

      console.error = vi.fn();

      component.clientType = 'unregistered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(console.error).toHaveBeenCalled();
    });

    it('hora ocupada (10:00)', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: 'hora ocupada' }))
      );

      component.clientType = 'unregistered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '10:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });
  });

  /* =========================
      CU-07 Reserva de Cita cliente registrado (Peluquero) 
  ========================= */

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
      component.bookingDate = '2026-05-05';
      component.bookingTime = '';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');
      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('error si no selecciona cliente', () => {
      component.clientType = 'registered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = null;

      component.bookAppointment();

      expect(component.guestNameError)
        .toBe('Debes seleccionar un cliente registrado');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    it('crea cita correctamente', () => {
      apiMock.createAppointment.mockReturnValue(of(mockResponse));

      component.clientType = 'registered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });

    it('error backend', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => new Error('error'))
      );

      console.error = vi.fn();

      component.clientType = 'registered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(console.error).toHaveBeenCalled();
    });

    it('hora ocupada (10:00)', () => {
      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: 'ocupada' }))
      );

      component.clientType = 'registered';
      component.bookingDate = '2026-05-05';
      component.bookingTime = '10:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });
  });
});