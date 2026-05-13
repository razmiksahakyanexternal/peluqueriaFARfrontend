package org.peluqueriaFAR.peluqueriaFAR.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    @NotBlank(message = "Los apellidos son obligatorios")
    private String surname;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email invalido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "La contraseña debe contener al menos una letra y un numero"
    )
    private String password;

    @Size(max = 8, message = "El telefono puede tener como maximo 8 digitos")
    @Pattern(regexp = "^\\d{0,8}$", message = "El telefono solo puede contener hasta 8 digitos")
    private String mobilePhone;
}
