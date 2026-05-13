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
public class BlockedSlotResponse {
    private Long id;
    private LocalDate blockedDate;
    private Boolean allDay;
    private LocalTime startTime;
    private LocalTime endTime;
}

