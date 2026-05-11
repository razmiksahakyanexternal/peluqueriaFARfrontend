import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeluqueroComponent } from './peluquero.component';
import { AuthService } from '../auth.service';
import { ReservasApiService, CreateAppointmentResponse } from '../reservas-api.service';
import { of, throwError } from 'rxjs';

describe('PeluqueroComponent - CU-06 y CU-07', () => {

  // Componente que vamos a probar
  let component: PeluqueroComponent;

  // Fixture para acceder al componente y al HTML
  let fixture: ComponentFixture<PeluqueroComponent>;

  // Mocks de servicios
  let authMock: any;
  let apiMock: any;

  // Respuesta simulada de creación de cita
  const mockResponse: CreateAppointmentResponse = {
    id: 1,
    message: 'ok',
    appointmentDate: '2027-05-05',
    startTime: '10:00',
    endTime: '10:30'
  };

  beforeEach(async () => {

    // Mock del servicio de autenticación
    authMock = {
      getToken: vi.fn().mockReturnValue('token123')
    };

    // Mock del servicio API
    apiMock = {

      // Método principal que se prueba
      createAppointment: vi.fn(),

      // Métodos necesarios para evitar errores en ngOnInit
      getAppointmentsInRange: vi.fn().mockReturnValue(of([])),
      getUsers: vi.fn().mockReturnValue(of([])),
      searchUsers: vi.fn().mockReturnValue(of([]))
    };

    // Configuración del entorno de pruebas
    await TestBed.configureTestingModule({
      imports: [PeluqueroComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ReservasApiService, useValue: apiMock }
      ]
    }).compileComponents();

    // Creación del componente
    fixture = TestBed.createComponent(PeluqueroComponent);
    component = fixture.componentInstance;

    // Ejecuta ngOnInit()
    fixture.detectChanges();
  });

  /* ======================================================
      CU-06 Reserva de cita para cliente NO registrado
  ====================================================== */

  describe('CU-06 - Cliente no registrado', () => {

    // Verifica que la fecha es obligatoria
    it('error si falta fecha', () => {

      component.clientType = 'unregistered';
      component.bookingDate = '';
      component.bookingTime = '10:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.dateError).toBe('La fecha es obligatoria');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica que la hora es obligatoria
    it('error si falta hora', () => {

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica que el nombre es obligatorio
    it('error si falta nombre', () => {

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.guestName = '';

      component.bookAppointment();

      expect(component.guestNameError).toBe('Debes introducir el nombre del cliente');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica que la cita se crea correctamente
    it('crea cita correctamente', () => {

      // Simula respuesta correcta del backend
      apiMock.createAppointment.mockReturnValue(of(mockResponse));

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });

    // Verifica manejo de errores del backend
    it('error backend', () => {

      // Simula error del servidor
      apiMock.createAppointment.mockReturnValue(
        throwError(() => new Error('error'))
      );

      // Mock de console.error
      console.error = vi.fn();

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(console.error).toHaveBeenCalled();
    });

    // Simula una hora ya ocupada
    it('hora ocupada (10:00)', () => {

      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: 'hora ocupada' }))
      );

      component.clientType = 'unregistered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.guestName = 'Juan';

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });
  });

  /* ======================================================
      CU-07 Reserva de cita para cliente REGISTRADO
  ====================================================== */

  describe('CU-07 - Cliente registrado', () => {

    // Verifica que la fecha es obligatoria
    it('error si falta fecha', () => {

      component.clientType = 'registered';
      component.bookingDate = '';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(component.dateError).toBe('La fecha es obligatoria');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica que la hora es obligatoria
    it('error si falta hora', () => {

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(component.timeError).toBe('La hora es obligatoria');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica que debe seleccionarse un cliente registrado
    it('error si no selecciona cliente', () => {

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = null;

      component.bookAppointment();

      expect(component.guestNameError).toBe('Debes seleccionar un cliente registrado');

      expect(apiMock.createAppointment).not.toHaveBeenCalled();
    });

    // Verifica creación correcta de cita
    it('crea cita correctamente', () => {

      apiMock.createAppointment
        .mockReturnValue(of(mockResponse));

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });

    // Verifica errores del backend
    it('error backend', () => {

      apiMock.createAppointment.mockReturnValue(
        throwError(() => new Error('error'))
      );

      console.error = vi.fn();

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '16:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(console.error).toHaveBeenCalled();
    });

    // Simula una hora ocupada
    it('hora ocupada (10:00)', () => {

      apiMock.createAppointment.mockReturnValue(
        throwError(() => ({ error: 'ocupada' }))
      );

      component.clientType = 'registered';
      component.bookingDate = '2027-05-05';
      component.bookingTime = '10:00';
      component.selectedUserId = 1;

      component.bookAppointment();

      expect(apiMock.createAppointment).toHaveBeenCalled();
    });
  });
});