import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PeluqueroComponent } from './peluquero.component';
import { AuthService } from '../auth.service';
import { ReservasApiService } from '../reservas-api.service';

describe('PeluqueroComponent', () => {
  let component: PeluqueroComponent;
  let fixture: ComponentFixture<PeluqueroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PeluqueroComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        AuthService,
        ReservasApiService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeluqueroComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should build week days correctly', () => {
    component.selectedDate = new Date('2024-01-15'); // Monday
    component.buildWeekDays();
    expect(component.weekDays.length).toBe(7);
    expect(component.weekDays[0].name).toBe('Lunes');
    expect(component.weekDays[6].name).toBe('Domingo');
  });

  it('should filter appointments this week', () => {
    component.selectedDate = new Date('2024-01-15');
    component.buildWeekDays();
    component.appointments = [
      { id: 1, appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:15', guestName: 'Test' },
      { id: 2, appointmentDate: '2024-01-20', startTime: '11:00', endTime: '11:15', guestName: 'Test2' }
    ];
    const weekAppointments = component.appointmentsThisWeek;
    expect(weekAppointments.length).toBe(2);
  });

  it('should move period correctly for week view', () => {
    component.viewMode = 'week';
    component.selectedDate = new Date('2024-01-15');
    component.movePeriod(1);
    expect(component.selectedDate.getDate()).toBe(22); // Next Monday
  });

  it('should change view mode', () => {
    component.changeView('month');
    expect(component.viewMode).toBe('month');
  });

  it('should generate calendar events', () => {
    component.selectedDate = new Date('2024-01-15');
    component.buildWeekDays();
    component.appointments = [
      { id: 1, appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:15', guestName: 'Test' }
    ];
    const events = component.calendarEvents;
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('Test');
  });
});