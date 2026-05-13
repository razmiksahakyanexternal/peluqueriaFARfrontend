package org.peluqueriaFAR.peluqueriaFAR.service;

import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.BlockedSlotCreateRequest;
import org.peluqueriaFAR.peluqueriaFAR.dto.BlockedSlotResponse;
import org.peluqueriaFAR.peluqueriaFAR.entities.BlockedSlot;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.peluqueriaFAR.peluqueriaFAR.repository.BlockedSlotRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockedSlotService {
    private final BlockedSlotRepository blockedSlotRepository;
    private final UserRepository userRepository;

    @Transactional
    public BlockedSlotResponse createForCurrentBarber(BlockedSlotCreateRequest request) {
        User barber = getCurrentUserOrThrow();

        if (Boolean.TRUE.equals(request.getAllDay())) {
            if (request.getStartTime() != null || request.getEndTime() != null) {
                throw new IllegalArgumentException("Si allDay=true, startTime y endTime deben ser null");
            }
            if (blockedSlotRepository.existsByBarberAndBlockedDate(barber, request.getBlockedDate())) {
                throw new IllegalArgumentException("Ya existe un bloqueo para ese dia");
            }

            BlockedSlot saved = blockedSlotRepository.save(BlockedSlot.builder()
                    .barber(barber)
                    .blockedDate(request.getBlockedDate())
                    .allDay(true)
                    .startTime(null)
                    .endTime(null)
                    .build());

            return toResponse(saved);
        }

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = request.getEndTime();
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Para bloquear un periodo, startTime y endTime son obligatorios");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("endTime debe ser posterior a startTime");
        }
        if (blockedSlotRepository.existsByBarberAndBlockedDateAndAllDayTrue(barber, request.getBlockedDate())) {
            throw new IllegalArgumentException("Ese dia ya esta bloqueado completo");
        }
        if (blockedSlotRepository.existsOverlappingPeriod(barber, request.getBlockedDate(), startTime, endTime)) {
            throw new IllegalArgumentException("El periodo se solapa con otro bloqueo existente");
        }

        BlockedSlot saved = blockedSlotRepository.save(BlockedSlot.builder()
                .barber(barber)
                .blockedDate(request.getBlockedDate())
                .allDay(false)
                .startTime(startTime)
                .endTime(endTime)
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BlockedSlotResponse> getForCurrentBarberInRange(LocalDate start, LocalDate end) {
        User barber = getCurrentUserOrThrow();
        return blockedSlotRepository.findByBarberAndBlockedDateBetweenOrderByBlockedDateAscStartTimeAsc(barber, start, end)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BlockedSlotResponse updateForCurrentBarber(Long id, BlockedSlotCreateRequest request) {
        User barber = getCurrentUserOrThrow();
        BlockedSlot existing = blockedSlotRepository.findByIdAndBarber(id, barber)
                .orElseThrow(() -> new IllegalArgumentException("Bloqueo no encontrado"));
        List<BlockedSlot> sameDay = blockedSlotRepository.findByBarberAndBlockedDateBetweenOrderByBlockedDateAscStartTimeAsc(
                barber, request.getBlockedDate(), request.getBlockedDate());

        if (Boolean.TRUE.equals(request.getAllDay())) {
            if (request.getStartTime() != null || request.getEndTime() != null) {
                throw new IllegalArgumentException("Si allDay=true, startTime y endTime deben ser null");
            }
            boolean hasOtherBlocks = sameDay.stream()
                    .anyMatch(bs -> !bs.getId().equals(existing.getId()));
            if (hasOtherBlocks) {
                throw new IllegalArgumentException("Ya existe un bloqueo para ese dia");
            }

            existing.setBlockedDate(request.getBlockedDate());
            existing.setAllDay(true);
            existing.setStartTime(null);
            existing.setEndTime(null);

            return toResponse(blockedSlotRepository.save(existing));
        }

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = request.getEndTime();
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Para bloquear un periodo, startTime y endTime son obligatorios");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("endTime debe ser posterior a startTime");
        }

        boolean hasOtherAllDayBlock = sameDay.stream()
                .filter(bs -> !bs.getId().equals(existing.getId()))
                .anyMatch(bs -> Boolean.TRUE.equals(bs.getAllDay()));
        if (hasOtherAllDayBlock) {
            throw new IllegalArgumentException("Ese dia ya esta bloqueado completo");
        }

        boolean overlaps = sameDay.stream()
                .filter(bs -> !bs.getId().equals(existing.getId()))
                .filter(bs -> !Boolean.TRUE.equals(bs.getAllDay()))
                .filter(bs -> bs.getStartTime() != null && bs.getEndTime() != null)
                .anyMatch(bs -> startTime.isBefore(bs.getEndTime()) && endTime.isAfter(bs.getStartTime()));
        if (overlaps) {
            throw new IllegalArgumentException("El periodo se solapa con otro bloqueo existente");
        }

        existing.setBlockedDate(request.getBlockedDate());
        existing.setAllDay(false);
        existing.setStartTime(startTime);
        existing.setEndTime(endTime);

        return toResponse(blockedSlotRepository.save(existing));
    }

    @Transactional
    public void deleteForCurrentBarber(Long id) {
        User barber = getCurrentUserOrThrow();
        BlockedSlot existing = blockedSlotRepository.findByIdAndBarber(id, barber)
                .orElseThrow(() -> new IllegalArgumentException("Bloqueo no encontrado"));
        blockedSlotRepository.delete(existing);
    }

    private User getCurrentUserOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new IllegalArgumentException("No autenticado");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private BlockedSlotResponse toResponse(BlockedSlot slot) {
        return BlockedSlotResponse.builder()
                .id(slot.getId())
                .blockedDate(slot.getBlockedDate())
                .allDay(slot.getAllDay())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .build();
    }
}
