package org.peluqueriaFAR.peluqueriaFAR.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.ErrorResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.WorkingDaysRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.WorkingDaysResponse;
import org.peluqueriaFAR.peluqueriaFAR.entities.BarberScheduleConfig;
import org.peluqueriaFAR.peluqueriaFAR.service.WorkingDaysService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/barber/working-days")
@RequiredArgsConstructor
public class WorkingDaysController {
    private final WorkingDaysService workingDaysService;

    @GetMapping
    public ResponseEntity<WorkingDaysResponse> get() {
        return ResponseEntity.ok(workingDaysService.getForCurrentBarber());
    }

    @GetMapping("/reservation")
    public ResponseEntity<WorkingDaysResponse> getReservationSchedule() {
        BarberScheduleConfig config = workingDaysService.getReservationConfig();
        return ResponseEntity.ok(new WorkingDaysResponse(
                workingDaysService.getReservationWorkingDays(),
                formatTime(config.getMorningStart()),
                formatTime(config.getMorningEnd()),
                formatTime(config.getAfternoonStart()),
                formatTime(config.getAfternoonEnd())
        ));
    }

    @PutMapping
    public ResponseEntity<?> set(@Valid @RequestBody WorkingDaysRequest request) {
        try {
            return ResponseEntity.ok(workingDaysService.setForCurrentBarber(
                    request.getWorkingDays(),
                    request.getMorningStart(),
                    request.getMorningEnd(),
                    request.getAfternoonStart(),
                    request.getAfternoonEnd()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    private String formatTime(java.time.LocalTime time) {
        return time == null ? null : time.toString();
    }
}
