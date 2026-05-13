package org.peluqueriaFAR.peluqueriaFAR.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedSlotCreateRequest {
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate blockedDate;

    /**
     * Si es true, bloquea el día completo (startTime/endTime deben ser null).
     * Si es false, requiere startTime y endTime.
     */
    @NotNull(message = "El campo allDay es obligatorio")
    private Boolean allDay;

    private LocalTime startTime;
    private LocalTime endTime;
}

