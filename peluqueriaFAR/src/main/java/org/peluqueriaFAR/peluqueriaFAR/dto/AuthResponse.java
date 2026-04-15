package org.peluqueriaFAR.peluqueriaFAR.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    @JsonProperty("jwtToken")
    private String token;
    private String role;
}
