package org.peluqueriaFAR.peluqueriaFAR.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    private String message;
    private String verificationUrl;
    private Boolean verificationEmailSent;

    public RegisterResponse(String message) {
        this(message, null, null);
    }
}
