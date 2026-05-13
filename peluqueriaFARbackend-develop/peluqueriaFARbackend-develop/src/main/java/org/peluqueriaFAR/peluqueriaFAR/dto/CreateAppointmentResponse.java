package org.peluqueriaFAR.peluqueriaFAR.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateAppointmentResponse(
	Long id,
	String message,
	LocalDate appointmentDate,
	LocalTime startTime,
	LocalTime endTime,
	String guestName
) {
}