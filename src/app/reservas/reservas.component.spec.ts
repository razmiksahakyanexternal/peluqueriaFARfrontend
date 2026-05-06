import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservasComponent } from './reservas.component';
import { Router } from '@angular/router';

describe('ReservasComponent', () => {
  let component: ReservasComponent;
  let fixture: ComponentFixture<ReservasComponent>;
  let routerMock: any;

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ReservasComponent], 
      providers: [
        { provide: Router, useValue: routerMock } 
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservasComponent);
    component = fixture.componentInstance;

    // ✔ inicialización controlada
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});