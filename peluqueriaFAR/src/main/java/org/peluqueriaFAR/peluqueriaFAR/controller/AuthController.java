package org.peluqueriaFAR.peluqueriaFAR.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.*;
import org.peluqueriaFAR.peluqueriaFAR.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verifyAccount(@RequestParam("token") String token) {
        try {
            authService.verifyAccount(token);
            URI redirectUri = URI.create(frontendUrl + "/inicio-sesion?verified=true");
            return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
        } catch (IllegalArgumentException e) {
            URI redirectUri = URI.create(frontendUrl + "/inicio-sesion?verified=false&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
            return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("El correo es obligatorio"));
        }

        try {
            authService.validateLocalLoginEmail(email);
            return ResponseEntity.ok(Map.of("message", "Cuenta local encontrada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            AuthResponse response = authService.loginWithGoogle(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/google/login")
    public ResponseEntity<Void> googleLoginRedirect() {
        URI redirectUri = URI.create(authService.buildGoogleAuthorizationUrl());
        return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
    }

    @GetMapping("/google/callback")
    public ResponseEntity<Void> googleCallback(@RequestParam("code") String code) {
        try {
            String jwtToken = authService.loginWithGoogleCode(code);
            URI frontendUri = URI.create("http://localhost:4200/inicio-sesion?token=" + jwtToken);
            return ResponseEntity.status(HttpStatus.FOUND).location(frontendUri).build();
        } catch (IllegalArgumentException e) {
            // Redirigir al frontend con error
            URI frontendUri = URI.create("http://localhost:4200/inicio-sesion?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
            return ResponseEntity.status(HttpStatus.FOUND).location(frontendUri).build();
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors);
    }
}
