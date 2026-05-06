import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioSesionComponent } from './inicio-sesion.component';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

describe('InicioSesionComponent - Casos de uso login', () => {
  let component: InicioSesionComponent;
  let fixture: ComponentFixture<InicioSesionComponent>;

  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      saveToken: vi.fn(),
      saveRole: vi.fn(),
      saveName: vi.fn(),
      saveSurname: vi.fn(),
      isLoggedIn: vi.fn().mockReturnValue(false),
      getRedirectRouteByRole: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [InicioSesionComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InicioSesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 1. LOGIN CLIENTE
  it('deberia iniciar sesion como cliente correctamente', () => {
    const mockResponse = {
      token: 'token-cliente',
      role: 'CLIENT',
      name: 'Cliente',
      surname: 'Test'
    };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    authServiceMock.getRedirectRouteByRole.mockReturnValue('/cliente');

    const formMock = {
      invalid: false,
      value: {
        email: 'cliente@gmail.com',
        password: 'Rafik312@'
      }
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(authServiceMock.saveRole).toHaveBeenCalledWith('CLIENT');
    expect(component.successMessage).toBe('Inicio de sesion exitoso.');
  });

  // 2. LOGIN PELUQUERO
  it('deberia iniciar sesion como peluquero correctamente', () => {
    const mockResponse = {
      token: 'token-peluquero',
      role: 'PELUQUERO',
      name: 'Vendedor',
      surname: 'Test'
    };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    authServiceMock.getRedirectRouteByRole.mockReturnValue('/peluquero');

    const formMock = {
      invalid: false,
      value: {
        email: 'vendedor@gmail.com',
        password: 'Rafik312@'
      }
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(authServiceMock.saveRole).toHaveBeenCalledWith('PELUQUERO');
    expect(component.successMessage).toBe('Inicio de sesion exitoso.');
  });

  // 3. CAMPOS VACÍOS
  it('no deberia hacer login si email y password estan vacios', () => {
    const formMock = {
      invalid: true,
      value: {
        email: '',
        password: ''
      }
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.successMessage).toBeNull();
  });

  // 4. CREDENCIALES INCORRECTAS
  it('deberia mostrar error si las credenciales son incorrectas', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'No existe una cuenta con ese email o la contrasena es incorrecta'
        }
      }))
    );

    const formMock = {
      invalid: false,
      value: {
        email: 'prueba@gmail.com',
        password: '1234'
      }
    } as NgForm;

    component.onSubmit(formMock);

    expect(component.errorMessage).toBe(
      'No existe una cuenta con ese email o la contrasena es incorrecta'
    );
  });
});