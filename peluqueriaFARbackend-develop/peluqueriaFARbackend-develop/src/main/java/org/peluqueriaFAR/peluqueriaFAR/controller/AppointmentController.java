package org.peluqueriaFAR.peluqueriaFAR.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.AppointmentResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.CreateAppointmentRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.CreateAppointmentResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.ErrorResponse;
import org.peluqueriaFAR.peluqueriaFAR.entities.Appointment;
import org.peluqueriaFAR.peluqueriaFAR.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {
	private final AppointmentService appointmentService;

@PostMapping
	public ResponseEntity<?> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
		try {
			Appointment appointment = appointmentService.createAppointment(request);
			CreateAppointmentResponse response = new CreateAppointmentResponse(
				appointment.getId(),
				"La cita se ha confirmado correctamente.",
				appointment.getAppointmentDate(),
				appointment.getStartTime(),
				appointment.getEndTime(),
				appointment.getGuestName()
			);
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
		}
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new HashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(error -> 
			errors.put(error.getField(), error.getDefaultMessage())
		);
		return ResponseEntity.badRequest().body(errors);
	}

	@GetMapping("/occupied")
	public ResponseEntity<List<String>> getOccupiedSlots(
		@RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
	) {
		return ResponseEntity.ok(appointmentService.getOccupiedStartTimes(date));
	}

	@GetMapping("/my")
	public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
		return ResponseEntity.ok(appointmentService.getMyAppointments());
	}

	@GetMapping("/range")
	public ResponseEntity<List<AppointmentResponse>> getAppointmentsInRange(
		@RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
		@RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
	) {
		return ResponseEntity.ok(appointmentService.getAppointmentsInRange(start, end));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
		try {
			appointmentService.deleteAppointment(id);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(e.getMessage()));
		}
	}
}
