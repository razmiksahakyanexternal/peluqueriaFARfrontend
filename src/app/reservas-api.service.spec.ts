import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservasApiService } from './reservas-api.service';

describe('ReservasApiService', () => {
  let service: ReservasApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservasApiService]
    });
    service = TestBed.inject(ReservasApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get occupied slots', () => {
    const mockOccupiedSlots = ['10:00', '11:00'];
    const date = '2024-01-15';

    service.getOccupiedSlots(date, 'token').subscribe(slots => {
      expect(slots).toEqual(mockOccupiedSlots);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/occupied?date=${date}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush(mockOccupiedSlots);
  });

  it('should create appointment', () => {
    const request: any = { appointmentDate: '2024-01-15', startTime: '10:00:00', guestName: 'Test' };
    const mockResponse = { id: 1, message: 'Success', appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:15', guestName: 'Test' };

    service.createAppointment(request, 'token').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(service['baseUrl']);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get my appointments', () => {
    const mockAppointments = [{ id: 1, appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:15', guestName: 'Test' }];

    service.getMyAppointments('token').subscribe(appointments => {
      expect(appointments).toEqual(mockAppointments);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/my`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointments);
  });

  it('should get appointments in range', () => {
    const start = '2024-01-01';
    const end = '2024-01-31';
    const mockAppointments = [{ id: 1, appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:15', guestName: 'Test' }];

    service.getAppointmentsInRange(start, end, 'token').subscribe(appointments => {
      expect(appointments).toEqual(mockAppointments);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/range?start=${start}&end=${end}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointments);
  });

  it('should get users', () => {
    const mockUsers = [{ id: 1, name: 'John', surname: 'Doe', email: 'john@example.com' }];

    service.getUsers('token').subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(service['usersUrl']);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});