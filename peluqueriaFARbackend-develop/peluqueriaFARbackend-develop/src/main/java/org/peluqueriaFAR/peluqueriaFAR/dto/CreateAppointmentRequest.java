package org.peluqueriaFAR.peluqueriaFAR.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateAppointmentRequest {
	@NotNull(message = "La fecha es obligatoria")
	private LocalDate appointmentDate;

	@NotNull(message = "La hora es obligatoria")
	private LocalTime startTime;

	private String guestName;
	private String guestPhone;


	private Long userId;

}
