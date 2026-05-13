import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeluqueroComponent } from './peluquero.component';
import { AuthService } from '../auth.service';
import { ReservasApiService } from '../reservas-api.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('PeluqueroComponent', () => {
  let component: PeluqueroComponent;
  let fixture: ComponentFixture<PeluqueroComponent>;

  const authServiceMock = {
    getName: jasmine.createSpy().and.returnValue('Juan'),
    getSurname: jasmine.createSpy().and.returnValue('Pérez'),
    getToken: jasmine.createSpy().and.returnValue('fake-token'),
    logout: jasmine.createSpy()
  };

  const reservasApiMock = {
    getAppointmentsInRange: jasmine.createSpy().and.returnValue(of([])),
    deleteAppointment: jasmine.createSpy().and.returnValue(of({}))
  };

  const routerMock = {
    navigate: jasmine.createSpy()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeluqueroComponent], // 👈 standalone component
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ReservasApiService, useValue: reservasApiMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeluqueroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize current user on init', () => {
    expect(component.currentUser.name).toBe('Juan');
    expect(component.currentUser.surname).toBe('Pérez');
  });

  it('should load calendar on init', () => {
    expect(component.calendarDays.length).toBeGreaterThan(0);
  });
});