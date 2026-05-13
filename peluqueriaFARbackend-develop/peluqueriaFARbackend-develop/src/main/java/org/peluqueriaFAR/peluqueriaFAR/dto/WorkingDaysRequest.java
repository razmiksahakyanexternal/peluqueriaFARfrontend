package org.peluqueriaFAR.peluqueriaFAR.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkingDaysRequest {
    @NotNull(message = "Los dias laborables son obligatorios")
    private List<DayOfWeek> workingDays;

    @NotNull(message = "La hora de inicio de la manana es obligatoria")
    private String morningStart;

    @NotNull(message = "La hora de fin de la manana es obligatoria")
    private String morningEnd;

    private String afternoonStart;

    private String afternoonEnd;
}
