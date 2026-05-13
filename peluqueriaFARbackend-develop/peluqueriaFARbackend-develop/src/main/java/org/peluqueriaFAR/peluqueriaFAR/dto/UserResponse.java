package org.peluqueriaFAR.peluqueriaFAR.dto;

public record UserResponse(
    Long id,
    String name,
    String surname,
    String email
) {}