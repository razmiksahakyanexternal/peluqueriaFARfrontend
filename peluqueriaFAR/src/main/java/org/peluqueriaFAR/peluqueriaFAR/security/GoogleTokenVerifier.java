package org.peluqueriaFAR.peluqueriaFAR.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final String GOOGLE_ISSUER_HTTPS = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_NO_SCHEME = "accounts.google.com";

    private final JwtDecoder jwtDecoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String googleClientId) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                this::validateIssuer
        );

        if (googleClientId != null && !googleClientId.isBlank()) {
            validator = new DelegatingOAuth2TokenValidator<>(validator, new AudienceValidator(googleClientId));
        }

        decoder.setJwtValidator(validator);
        this.jwtDecoder = decoder;
    }

    private OAuth2TokenValidatorResult validateIssuer(Jwt token) {
        String issuer = token.getIssuer() != null ? token.getIssuer().toString() : null;
        if (GOOGLE_ISSUER_HTTPS.equals(issuer) || GOOGLE_ISSUER_NO_SCHEME.equals(issuer)) {
            return OAuth2TokenValidatorResult.success();
        }
        OAuth2Error error = new OAuth2Error("invalid_token", "El issuer del token de Google no es válido", null);
        return OAuth2TokenValidatorResult.failure(error);
    }

    public GoogleUserInfo verify(String idToken) {
        try {
            Jwt jwt = jwtDecoder.decode(idToken);
            return new GoogleUserInfo(
                    jwt.getClaimAsString("email"),
                    getBooleanClaim(jwt, "email_verified"),
                    jwt.getClaimAsString("given_name"),
                    jwt.getClaimAsString("family_name"),
                    jwt.getClaimAsString("name"));
        } catch (Exception ex) {
            throw new IllegalArgumentException("El token de Google no es valido");
        }
    }

    private boolean getBooleanClaim(Jwt jwt, String claimName) {
        Object value = jwt.getClaims().get(claimName);
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private static final class AudienceValidator implements OAuth2TokenValidator<Jwt> {
        private final String clientId;

        private AudienceValidator(String clientId) {
            this.clientId = clientId;
        }

        @Override
        public OAuth2TokenValidatorResult validate(Jwt token) {
            if (token.getAudience().contains(clientId)) {
                return OAuth2TokenValidatorResult.success();
            }
            OAuth2Error error = new OAuth2Error(
                    "invalid_token",
                    "El token de Google no pertenece a este cliente",
                    null);
            return OAuth2TokenValidatorResult.failure(error);
        }
    }

    public record GoogleUserInfo(
            String email,
            boolean emailVerified,
            String givenName,
            String familyName,
            String name) {
    }
}
