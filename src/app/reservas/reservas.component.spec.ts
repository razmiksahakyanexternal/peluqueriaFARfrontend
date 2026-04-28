import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ReservasComponent } from './reservas.component';
import { AuthService } from '../auth.service';
import { AppointmentsLocalService } from '../appointments-local.service';
import { ReservasApiService } from '../reservas-api.service';

describe('ReservasComponent', () => {
  let component: ReservasComponent;
  let fixture: ComponentFixture<ReservasComponent>;

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
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize default date', () => {
    component.ngOnInit();
    expect(component.selectedDate).toBeTruthy();
  });

  it('should check if time is occupied', () => {
    component.occupiedHours = new Set(['10:00']);
    expect(component.isTimeOccupied('10:00')).toBeTrue();
    expect(component.isTimeOccupied('11:00')).toBeFalse();
  });

  it('should select date and load occupied slots', () => {
    spyOn(component, 'loadOccupiedSlots');
    component.onDateSelect(new Date('2024-01-15'));
    expect(component.selectedDate).toEqual(new Date('2024-01-15'));
    expect(component.loadOccupiedSlots).toHaveBeenCalled();
  });

  it('should select time', () => {
    component.onTimeSelect('10:00');
    expect(component.selectedTime).toBe('10:00');
  });

  it('should confirm appointment', () => {
    component.selectedDate = new Date('2024-01-15');
    component.selectedTime = '10:00';
    spyOn(component.appointmentsLocalService, 'addAppointment');
    spyOn(component.reservasApiService, 'createAppointment').and.returnValue({
      subscribe: jasmine.createSpy('subscribe')
    } as any);
    component.confirmarCita();
    expect(component.citaConfirmada).toBeTrue();
  });
});
