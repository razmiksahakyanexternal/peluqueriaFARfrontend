package org.peluqueriaFAR.peluqueriaFAR.security;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final String googleClientId;
    private final RestTemplate restTemplate = new RestTemplate();

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String googleClientId) {
        this.googleClientId = googleClientId;
    }

    public GoogleUserInfo verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Google no ha devuelto un id_token");
        }

        GoogleTokenInfo tokenInfo = fetchTokenInfo(idToken);
        validateAudience(tokenInfo);

        return new GoogleUserInfo(
                tokenInfo.email(),
                parseBoolean(tokenInfo.emailVerified()),
                tokenInfo.givenName(),
                tokenInfo.familyName(),
                tokenInfo.name());
    }

    private GoogleTokenInfo fetchTokenInfo(String idToken) {
        String url = UriComponentsBuilder
                .fromUriString(GOOGLE_TOKEN_INFO_URL)
                .queryParam("id_token", idToken)
                .toUriString();

        try {
            GoogleTokenInfo response = restTemplate.getForObject(url, GoogleTokenInfo.class);
            if (response == null) {
                throw new IllegalArgumentException("Google no ha devuelto informacion del token");
            }
            return response;
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("El token de Google no es valido: " + ex.getMessage(), ex);
        }
    }

    private void validateAudience(GoogleTokenInfo tokenInfo) {
        if (googleClientId == null || googleClientId.isBlank()) {
            return;
        }

        if (!googleClientId.equals(tokenInfo.audience())) {
            throw new IllegalArgumentException("El token de Google no pertenece a este cliente");
        }
    }

    private boolean parseBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private record GoogleTokenInfo(
            String aud,
            String email,
            @JsonProperty("email_verified") Object emailVerified,
            @JsonProperty("given_name") String givenName,
            @JsonProperty("family_name") String familyName,
            String name) {

        String audience() {
            return aud;
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
