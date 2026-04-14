package org.peluqueriaFAR.peluqueriaFAR;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.peluqueriaFAR.peluqueriaFAR.dto.AuthRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.AuthResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.GoogleAuthRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.RegisterRequest;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.peluqueriaFAR.peluqueriaFAR.model.Role;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.peluqueriaFAR.peluqueriaFAR.security.GoogleTokenVerifier;
import org.peluqueriaFAR.peluqueriaFAR.security.JwtUtil;
import org.peluqueriaFAR.peluqueriaFAR.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_shouldSaveUserAndReturnToken() {
        RegisterRequest request = new RegisterRequest("Carlos", "Perez", "carlos@example.com", "1234", "600000000");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashedpwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken(eq(request.getEmail()), eq(Role.CLIENT))).thenReturn("fake-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("fake-token", response.getToken());
        assertEquals(Role.CLIENT.name(), response.getRole());

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_whenEmailExists_shouldThrow() {
        RegisterRequest request = new RegisterRequest("Carlos", "Perez", "carlos@example.com", "1234", "600000000");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));

        assertEquals("El email ya esta registrado", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldReturnTokenWhenAuthenticated() {
        String email = "carlos@example.com";
        String password = "1234";
        AuthRequest request = new AuthRequest();
        request.setEmail(email);
        request.setPassword(password);

        User user = User.builder().email(email).role(Role.CLIENT).build();

        doNothing().when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(eq(email), eq(Role.CLIENT))).thenReturn("fake-token-login");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("fake-token-login", response.getToken());
        assertEquals(Role.CLIENT.name(), response.getRole());
    }

    @Test
    void login_whenBadCredentials_shouldThrow() {
        String email = "carlos@example.com";
        AuthRequest request = new AuthRequest();
        request.setEmail(email);
        request.setPassword("wrong");

        User user = User.builder().email(email).role(Role.CLIENT).authProvider(User.AuthProvider.LOCAL).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        doThrow(new BadCredentialsException("Bad credentials")).when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));

        assertEquals("No existe una cuenta con ese email o la contrasena es incorrecta", ex.getMessage());
    }

    @Test
    void login_whenAccountNotCreated_shouldThrow() {
        String email = "unknown@example.com";
        AuthRequest request = new AuthRequest();
        request.setEmail(email);
        request.setPassword("password");

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));

        assertEquals("La cuenta no está creada", ex.getMessage());
    }

    @Test
    void login_whenGoogleAccountExists_shouldThrow() {
        String email = "googleuser@example.com";
        AuthRequest request = new AuthRequest();
        request.setEmail(email);
        request.setPassword("password");

        User user = User.builder().email(email).role(Role.CLIENT).authProvider(User.AuthProvider.GOOGLE).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));

        assertEquals("Esta cuenta ya está registrada con google", ex.getMessage());
    }

    @Test
    void loginWithGoogle_whenNewGoogleUser_shouldCreateAndReturnToken() {
        String email = "googleuser@example.com";
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setIdToken("fake-goog-token");

        GoogleTokenVerifier.GoogleUserInfo googleInfo = new GoogleTokenVerifier.GoogleUserInfo(
                email,
                true,
                "Google",
                "User",
                "Google User"
        );

        when(googleTokenVerifier.verify(request.getIdToken())).thenReturn(googleInfo);
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken(eq(email), eq(Role.CLIENT))).thenReturn("token-google");

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("token-google", response.getToken());
        assertEquals(Role.CLIENT.name(), response.getRole());
        verify(userRepository).save(argThat(user -> user.getEmail().equals(email) && user.getAuthProvider() == User.AuthProvider.GOOGLE));
    }
}
