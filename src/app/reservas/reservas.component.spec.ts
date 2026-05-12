import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ReservasComponent } from './reservas.component';
import { AuthService } from '../auth.service';
import { AppointmentsLocalService } from '../appointments-local.service';
import { ReservasApiService } from '../reservas-api.service';
import { vi } from 'vitest';

describe('ReservasComponent', () => {
  let component: ReservasComponent;
  let fixture: ComponentFixture<ReservasComponent>;
  let authService: AuthService;
  let reservasApiService: ReservasApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReservasComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        AuthService,
        AppointmentsLocalService,
        ReservasApiService,
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservasComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    reservasApiService = TestBed.inject(ReservasApiService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize default date', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    component.ngOnInit();
    expect(component.selectedDate).toBeTruthy();
  });

  it('should check if time is occupied', () => {
    component.occupiedHours = new Set(['10:00']);
    expect(component.isTimeOccupied('10:00')).toBeTruthy();
    expect(component.isTimeOccupied('11:00')).toBeFalsy();
  });

  it('should select date and load occupied slots', () => {
    vi.spyOn(component as any, 'loadOccupiedHours');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    component.selectDate(futureDate.getDate());
    expect(component.selectedDate?.getDate()).toBe(futureDate.getDate());
    expect((component as any).loadOccupiedHours).toHaveBeenCalled();
  });

  it('should select time', () => {
    component.selectTime('10:00');
    expect(component.selectedTime).toBe('10:00');
  });

  it('should confirm appointment', () => {
    component.selectedDate = new Date('2024-01-15');
    component.selectedTime = '10:00';
    vi.spyOn(authService, 'getToken').mockReturnValue('token');
    vi.spyOn(authService, 'getFullName').mockReturnValue('Test User');
    vi.spyOn(reservasApiService, 'createAppointment').mockReturnValue({
      subscribe: vi.fn().mockImplementation((callbacks: any) => {
        callbacks.next({ message: 'Success' });
      })
    } as any);
    component.confirmBooking();
    expect(component.citaConfirmada).toBeTruthy();
  });
});
