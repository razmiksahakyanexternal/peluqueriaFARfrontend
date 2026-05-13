package org.peluqueriaFAR.peluqueriaFAR.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String name;
    private String surname;

    public AuthResponse(String token, String role) {
        this.token = token;
        this.role = role;
    }

    @JsonProperty("jwtToken")
    public String getJwtToken() {
        return token;
    }
}
