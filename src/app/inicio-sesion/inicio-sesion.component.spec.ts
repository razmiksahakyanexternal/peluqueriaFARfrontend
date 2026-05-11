import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioSesionComponent } from './inicio-sesion.component';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

describe('InicioSesionComponent - Casos de uso login', () => {

  // Componente que vamos a probar
  let component: InicioSesionComponent;
  
  // Fixture para acceder al componente y al HTML
  let fixture: ComponentFixture<InicioSesionComponent>;

  // Mocks de servicios
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {

    // Mock del servicio de autenticación
    authServiceMock = {
      login: vi.fn(), // Método principal que se prueba

      // Métodos auxiliares utilizados tras el login
      saveToken: vi.fn(),
      saveRole: vi.fn(),
      saveName: vi.fn(),
      saveSurname: vi.fn(),
      isLoggedIn: vi.fn().mockReturnValue(false), // Simula que inicialmente no hay sesión iniciada
      getRedirectRouteByRole: vi.fn() // Método para obtener la ruta según el rol
    };

    // Mock del Router de Angular
    routerMock = {
      navigate: vi.fn()
    };

    // Configuración del entorno de pruebas
    await TestBed.configureTestingModule({
      declarations: [InicioSesionComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    // Creación del componente
    fixture = TestBed.createComponent(InicioSesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit()
  });


  /* ======================================================
      CU-02 Login con Email y Contraseña
  ====================================================== */


  // 1. LOGIN CLIENTE
  it('deberia iniciar sesion como cliente correctamente', () => {
    
    // Respuesta simulada del backend
    const mockResponse = { 
      token: 'token-cliente',
      role: 'CLIENT',
      name: 'Cliente',
      surname: 'Test'
    };

    authServiceMock.login.mockReturnValue(of(mockResponse)); // Simula login exitoso
    authServiceMock.getRedirectRouteByRole.mockReturnValue('/cliente'); // Simula ruta de redirección


    // Formulario válido simulado
    const formMock = {
      invalid: false,
      value: {
        email: 'cliente@gmail.com',
        password: 'Rafik312@'
      }
    } as NgForm;

    component.onSubmit(formMock); // Ejecuta el método principal

    expect(authServiceMock.login).toHaveBeenCalled(); // Verifica llamada al login
    expect(authServiceMock.saveRole).toHaveBeenCalledWith('CLIENT'); // Verifica guardado del rol
    expect(component.successMessage).toBe('Inicio de sesion exitoso.'); // Verifica mensaje de éxito
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
   
    // Formulario inválido simulado
    const formMock = {
      invalid: true,
      value: {
        email: '',
        password: ''
      }
    } as NgForm;

    component.onSubmit(formMock);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.successMessage).toBeNull(); // Verifica que no haya mensaje de éxito
  });

  // 4. CREDENCIALES INCORRECTAS
  it('deberia mostrar error si las credenciales son incorrectas', () => {
    
    // Simula error del backend
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