package org.peluqueriaFAR.peluqueriaFAR.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.AuthRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.AuthResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.GoogleAuthRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.RegisterRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.RegisterResponse;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.peluqueriaFAR.peluqueriaFAR.entities.VerificationToken;
import org.peluqueriaFAR.peluqueriaFAR.model.Role;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.VerificationTokenRepository;
import org.peluqueriaFAR.peluqueriaFAR.security.GoogleTokenVerifier;
import org.peluqueriaFAR.peluqueriaFAR.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.google.redirect-uri:http://localhost:8081/auth/google/callback}")
    private String googleRedirectUri;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8081}")
    private String backendUrl;

    @Value("${app.mail.fail-fast:false}")
    private boolean mailFailFast;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya esta registrado");
        }

        User user = User.builder()
                .name(request.getName())
                .surname(request.getSurname())
                .email(request.getEmail())
                .mobilePhone(request.getMobilePhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CLIENT)
                .authProvider(User.AuthProvider.LOCAL)
                .enabled(false)
                .active(true)
                .build();

        userRepository.save(user);

        VerificationToken verificationToken = createVerificationToken(user);
        verificationTokenRepository.save(verificationToken);

        String verificationUrl = backendUrl + "/auth/verify?token=" + URLEncoder.encode(verificationToken.getToken(), StandardCharsets.UTF_8);
        boolean emailSent = sendVerificationEmail(user, verificationUrl);

        String message = emailSent
                ? "Se ha mandado un correo de verificacion de la cuenta, si esta existe"
                : "Cuenta creada. No se pudo enviar el correo; usa el enlace de verificacion generado.";
        return new RegisterResponse(message, verificationUrl, emailSent);
    }

    @Transactional
    public RegisterResponse resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("La cuenta no esta creada"));

        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Esta cuenta ya esta registrada con Google");
        }

        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new IllegalStateException("La cuenta ya esta verificada");
        }

        VerificationToken verificationToken = createVerificationToken(user);
        verificationTokenRepository.save(verificationToken);

        String verificationUrl = backendUrl + "/auth/verify?token=" + URLEncoder.encode(verificationToken.getToken(), StandardCharsets.UTF_8);
        boolean emailSent = sendVerificationEmail(user, verificationUrl);

        String message = emailSent
                ? "Se ha reenviado el correo de verificacion."
                : "No se pudo reenviar el correo; usa el enlace de verificacion generado.";
        return new RegisterResponse(message, verificationUrl, emailSent);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("La cuenta no esta creada"));

        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Esta cuenta ya esta registrada con Google");
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new IllegalArgumentException("La cuenta no esta verificada. Revisa tu correo de verificacion.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new IllegalArgumentException("No existe una cuenta con ese email o la contraseña es incorrecta");
        }

        return buildAuthResponse(user);
    }

    public void validateLocalLoginEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("La cuenta no esta creada"));

        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Esta cuenta ya esta registrada con Google");
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new IllegalArgumentException("La cuenta no esta verificada. Revisa tu correo de verificacion.");
        }
    }

    @Transactional
    public void verifyAccount(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de verificacion invalido o expirado"));

        if (verificationToken.getUsedAt() != null) {
            throw new IllegalArgumentException("Este enlace de verificacion ya se ha utilizado");
        }

        if (verificationToken.getExpiresAt() != null && verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace de verificacion ha expirado");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        verificationToken.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(verificationToken);
    }

    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenVerifier.GoogleUserInfo googleUser = googleTokenVerifier.verify(request.getIdToken());
        return loginGoogleUser(googleUser);
    }

    public String buildGoogleAuthorizationUrl() {
        String scope = URLEncoder.encode("openid email profile", StandardCharsets.UTF_8);
        String redirect = URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8);
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + googleClientId
                + "&redirect_uri=" + redirect
                + "&response_type=code"
                + "&scope=" + scope
                + "&prompt=select_account"
                + "&access_type=offline";
    }

    public AuthResponse loginWithGoogleCode(String code) {
        String idToken = exchangeCodeForIdToken(code);
        GoogleTokenVerifier.GoogleUserInfo googleUser = googleTokenVerifier.verify(idToken);
        return loginGoogleUser(googleUser);
    }

    private String exchangeCodeForIdToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", googleClientId);
        body.add("client_secret", googleClientSecret);
        body.add("redirect_uri", googleRedirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        GoogleTokenResponse response;

        try {
            response = restTemplate.postForObject("https://oauth2.googleapis.com/token", request, GoogleTokenResponse.class);
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("Error intercambiando el codigo de Google: " + ex.getMessage(), ex);
        }

        if (response == null || response.idToken() == null || response.idToken().isBlank()) {
            throw new IllegalArgumentException("No se obtuvo id_token de Google");
        }

        return response.idToken();
    }

    private AuthResponse loginGoogleUser(GoogleTokenVerifier.GoogleUserInfo googleUser) {
        if (googleUser.email() == null || googleUser.email().isBlank()) {
            throw new IllegalArgumentException("Google no ha devuelto un email valido");
        }
        if (!googleUser.emailVerified()) {
            throw new IllegalArgumentException("Google no ha verificado el email de esta cuenta");
        }

        User user = userRepository.findByEmail(googleUser.email())
                .map(existingUser -> updateGoogleProfile(existingUser, googleUser))
                .orElseGet(() -> createGoogleUser(googleUser));

        return buildAuthResponse(user);
    }

    private static record GoogleTokenResponse(@JsonProperty("id_token") String idToken) {}

    private User updateGoogleProfile(User user, GoogleTokenVerifier.GoogleUserInfo googleUser) {
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new IllegalArgumentException("La cuenta esta desactivada");
        }

        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            user.setName(resolveName(googleUser.givenName(), googleUser.name(), user.getName()));
            user.setSurname(resolveSurname(googleUser.familyName(), user.getSurname()));
            return userRepository.save(user);
        }

        return user;
    }

    private User createGoogleUser(GoogleTokenVerifier.GoogleUserInfo googleUser) {
        User user = User.builder()
                .name(resolveName(googleUser.givenName(), googleUser.name(), "Google"))
                .surname(resolveSurname(googleUser.familyName(), ""))
                .email(googleUser.email())
                .role(Role.CLIENT)
                .authProvider(User.AuthProvider.GOOGLE)
                .enabled(true)
                .active(true)
                .build();

        return userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(jwtToken, user.getRole().name(), user.getName(), user.getSurname());
    }

    private VerificationToken createVerificationToken(User user) {
        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(LocalDateTime.now().plusHours(24));
        return token;
    }

    private boolean sendVerificationEmail(User user, String verificationUrl) {
        String htmlBody = buildVerificationEmailBody(user.getName(), verificationUrl);
        try {
            emailService.sendVerificationEmail(user.getEmail(), "Verifica tu cuenta de Peluqueria FAR", htmlBody);
            return true;
        } catch (IllegalStateException ex) {
            if (mailFailFast) {
                throw ex;
            }
            return false;
        }
    }

    private String buildVerificationEmailBody(String name, String verificationUrl) {
        return "<p>Hola " + (name != null ? name : "") + ",</p>"
                + "<p>Gracias por registrarte en Peluqueria FAR.</p>"
                + "<p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>"
                + "<p><a href=\"" + verificationUrl + "\">Verificar mi cuenta</a></p>"
                + "<p>Si no has solicitado este registro, ignora este correo.</p>";
    }

    private String resolveName(String givenName, String fullName, String fallback) {
        if (givenName != null && !givenName.isBlank()) {
            return givenName;
        }
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return fallback;
    }

    private String resolveSurname(String familyName, String fallback) {
        if (familyName != null && !familyName.isBlank()) {
            return familyName;
        }
        return fallback;
    }
}
