package org.peluqueriaFAR.peluqueriaFAR.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.BlockedSlotCreateRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.BlockedSlotResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.ErrorResponse;
import org.peluqueriaFAR.peluqueriaFAR.service.BlockedSlotService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/barber/blocked-slots")
@RequiredArgsConstructor
public class BlockedSlotController {
    private final BlockedSlotService blockedSlotService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody BlockedSlotCreateRequest request) {
        try {
            BlockedSlotResponse response = blockedSlotService.createForCurrentBarber(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/range")
    public ResponseEntity<?> getInRange(@RequestParam("start") LocalDate start, @RequestParam("end") LocalDate end) {
        if (end.isBefore(start)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("end debe ser >= start"));
        }
        List<BlockedSlotResponse> response = blockedSlotService.getForCurrentBarberInRange(start, end);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, @Valid @RequestBody BlockedSlotCreateRequest request) {
        try {
            BlockedSlotResponse response = blockedSlotService.updateForCurrentBarber(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        try {
            blockedSlotService.deleteForCurrentBarber(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
