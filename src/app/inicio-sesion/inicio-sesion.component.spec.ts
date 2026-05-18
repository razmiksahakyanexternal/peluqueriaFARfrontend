import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { InicioSesionComponent } from './inicio-sesion.component';

describe('InicioSesionComponent - Casos de uso login', () => {
  let component: InicioSesionComponent;
  let fixture: ComponentFixture<InicioSesionComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      extractJwtToken: vi.fn((response) => response?.jwtToken || response?.token || null),
      saveToken: vi.fn(),
      saveRole: vi.fn(),
      saveName: vi.fn(),
      saveSurname: vi.fn(),
      isLoggedIn: vi.fn().mockReturnValue(false),
      getRedirectRouteByRole: vi.fn().mockReturnValue('/home'),
      redirectToGoogleLogin: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    activatedRouteMock = {
      snapshot: {
        queryParamMap: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };

    await TestBed.configureTestingModule({
      declarations: [InicioSesionComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioSesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deberia iniciar sesion como cliente correctamente', () => {
    const mockResponse = {
      token: 'token-cliente',
      role: 'CLIENT',
      name: 'Cliente',
      surname: 'Test',
    };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    authServiceMock.getRedirectRouteByRole.mockReturnValue('/home');

    const formMock = {
      invalid: false,
      value: {
        email: ' cliente@gmail.com ',
        password: ' Rafik312@ ',
      },
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'cliente@gmail.com',
      password: 'Rafik312@',
    });
    expect(authServiceMock.saveToken).toHaveBeenCalledWith('token-cliente');
    expect(authServiceMock.saveRole).toHaveBeenCalledWith('CLIENT');
    expect(authServiceMock.saveName).toHaveBeenCalledWith('Cliente');
    expect(authServiceMock.saveSurname).toHaveBeenCalledWith('Test');
    expect(component.successMessage).toBe('Inicio de sesión exitoso.');
  });

  it('deberia iniciar sesion como peluquero correctamente', () => {
    const mockResponse = {
      token: 'token-peluquero',
      role: 'BARBER',
      name: 'Razmik',
      surname: 'Sahakyan',
    };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    authServiceMock.getRedirectRouteByRole.mockReturnValue('/peluquero');

    const formMock = {
      invalid: false,
      value: {
        email: 'barber@gmail.com',
        password: 'Rafik312@',
      },
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(authServiceMock.saveRole).toHaveBeenCalledWith('BARBER');
    expect(component.successMessage).toBe('Inicio de sesión exitoso.');
  });

  it('no deberia hacer login si email y password estan vacios', () => {
    const formMock = {
      invalid: true,
      value: {
        email: '',
        password: '',
      },
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.successMessage).toBeNull();
  });

  it('deberia mostrar error si las credenciales son incorrectas', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'No existe una cuenta con ese email o la contraseña es incorrecta',
        },
      })),
    );

    const formMock = {
      invalid: false,
      value: {
        email: 'prueba@gmail.com',
        password: '1234',
      },
    } as NgForm;

    component.onSubmit(formMock);

    expect(component.errorMessage).toBe(
      'No existe una cuenta con ese email o la contraseña es incorrecta',
    );
  });

  it('muestra error si el backend no devuelve token', () => {
    authServiceMock.login.mockReturnValue(of({
      role: 'CLIENT',
      name: 'Cliente',
      surname: 'Test',
    }));
    authServiceMock.extractJwtToken.mockReturnValue(null);

    const formMock = {
      invalid: false,
      value: {
        email: 'cliente@gmail.com',
        password: 'Rafik312@',
      },
    } as NgForm;

    component.onSubmit(formMock);

    expect(component.errorMessage).toBe('Login correcto, pero no se recibio token JWT.');
    expect(authServiceMock.saveToken).not.toHaveBeenCalled();
  });
});
