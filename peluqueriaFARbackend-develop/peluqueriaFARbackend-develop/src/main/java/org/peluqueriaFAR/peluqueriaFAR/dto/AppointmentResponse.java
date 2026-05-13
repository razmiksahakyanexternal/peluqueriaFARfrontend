package org.peluqueriaFAR.peluqueriaFAR.dto;

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
public class AppointmentResponse {
    private Long id;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String guestName;
    private String guestPhone;
}
