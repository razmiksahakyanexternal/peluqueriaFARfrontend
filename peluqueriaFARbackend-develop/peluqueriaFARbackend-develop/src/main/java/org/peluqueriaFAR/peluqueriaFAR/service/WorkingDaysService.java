package org.peluqueriaFAR.peluqueriaFAR.service;

import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.WorkingDaysResponse;
import org.peluqueriaFAR.peluqueriaFAR.entities.BarberScheduleConfig;
import org.peluqueriaFAR.peluqueriaFAR.entities.BarberWorkingDay;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.peluqueriaFAR.peluqueriaFAR.model.Role;
import org.peluqueriaFAR.peluqueriaFAR.repository.BarberScheduleConfigRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.BarberWorkingDayRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkingDaysService {
    private static final LocalTime DEFAULT_MORNING_START = LocalTime.of(10, 0);
    private static final LocalTime DEFAULT_MORNING_END = LocalTime.of(14, 0);
    private static final LocalTime DEFAULT_AFTERNOON_START = LocalTime.of(15, 0);
    private static final LocalTime DEFAULT_AFTERNOON_END = LocalTime.of(18, 0);

    private final BarberWorkingDayRepository barberWorkingDayRepository;
    private final BarberScheduleConfigRepository barberScheduleConfigRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public WorkingDaysResponse getForCurrentBarber() {
        User barber = getCurrentUserOrThrow();
        return buildResponse(barber);
    }

    @Transactional
    public WorkingDaysResponse setForCurrentBarber(
            List<DayOfWeek> workingDays,
            String morningStart,
            String morningEnd,
            String afternoonStart,
            String afternoonEnd) {
        User barber = getCurrentUserOrThrow();
        List<DayOfWeek> uniqueDays = new LinkedHashSet<>(workingDays == null ? List.<DayOfWeek>of() : workingDays)
                .stream()
                .sorted(Comparator.comparingInt(DayOfWeek::getValue))
                .toList();

        if (uniqueDays.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar al menos un dia laborable");
        }

        LocalTime parsedMorningStart = parseTime(morningStart, "La hora de inicio de la manana no es valida");
        LocalTime parsedMorningEnd = parseTime(morningEnd, "La hora de fin de la manana no es valida");
        LocalTime parsedAfternoonStart = parseOptionalTime(afternoonStart, "La hora de inicio de la tarde no es valida");
        LocalTime parsedAfternoonEnd = parseOptionalTime(afternoonEnd, "La hora de fin de la tarde no es valida");

        validateSchedule(parsedMorningStart, parsedMorningEnd, parsedAfternoonStart, parsedAfternoonEnd);

        barberWorkingDayRepository.deleteByBarber(barber);
        List<BarberWorkingDay> savedDays = uniqueDays.stream()
                .map(day -> BarberWorkingDay.builder()
                        .barber(barber)
                        .dayOfWeek(day)
                        .build())
                .toList();
        barberWorkingDayRepository.saveAll(savedDays);

        BarberScheduleConfig config = barberScheduleConfigRepository.findByBarber(barber)
                .orElseGet(() -> BarberScheduleConfig.builder().barber(barber).build());
        config.setMorningStart(parsedMorningStart);
        config.setMorningEnd(parsedMorningEnd);
        config.setAfternoonStart(parsedAfternoonStart);
        config.setAfternoonEnd(parsedAfternoonEnd);
        barberScheduleConfigRepository.save(config);

        return buildResponse(barber, uniqueDays, config);
    }

    @Transactional(readOnly = true)
    public BarberScheduleConfig getReservationConfig() {
        User barber = userRepository.findFirstByRoleAndActiveTrueOrderByIdAsc(Role.BARBER)
                .orElse(null);
        if (barber == null) {
            return buildDefaultConfig(null);
        }
        return barberScheduleConfigRepository.findByBarber(barber)
                .orElseGet(() -> buildDefaultConfig(barber));
    }

    @Transactional(readOnly = true)
    public List<DayOfWeek> getReservationWorkingDays() {
        User barber = userRepository.findFirstByRoleAndActiveTrueOrderByIdAsc(Role.BARBER)
                .orElse(null);
        if (barber == null) {
            return List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);
        }

        List<DayOfWeek> days = toSortedDays(barberWorkingDayRepository.findByBarber(barber));
        if (days.isEmpty()) {
            return List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);
        }
        return days;
    }

    private WorkingDaysResponse buildResponse(User barber) {
        List<DayOfWeek> workingDays = toSortedDays(barberWorkingDayRepository.findByBarber(barber));
        BarberScheduleConfig config = barberScheduleConfigRepository.findByBarber(barber)
                .orElseGet(() -> buildDefaultConfig(barber));
        return buildResponse(barber, workingDays, config);
    }

    private WorkingDaysResponse buildResponse(User barber, List<DayOfWeek> workingDays, BarberScheduleConfig config) {
        BarberScheduleConfig resolvedConfig = config == null ? buildDefaultConfig(barber) : config;
        return new WorkingDaysResponse(
                workingDays,
                formatTime(resolvedConfig.getMorningStart()),
                formatTime(resolvedConfig.getMorningEnd()),
                formatTime(resolvedConfig.getAfternoonStart()),
                formatTime(resolvedConfig.getAfternoonEnd())
        );
    }

    private List<DayOfWeek> toSortedDays(List<BarberWorkingDay> workingDays) {
        return workingDays.stream()
                .map(BarberWorkingDay::getDayOfWeek)
                .sorted(Comparator.comparingInt(DayOfWeek::getValue))
                .toList();
    }

    private LocalTime parseTime(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(errorMessage);
        }
        try {
            return LocalTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private LocalTime parseOptionalTime(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private void validateSchedule(
            LocalTime morningStart,
            LocalTime morningEnd,
            LocalTime afternoonStart,
            LocalTime afternoonEnd) {
        if (!morningStart.isBefore(morningEnd)) {
            throw new IllegalArgumentException("La manana debe tener una hora de inicio anterior a la de fin");
        }

        boolean afternoonConfigured = afternoonStart != null || afternoonEnd != null;
        if (afternoonConfigured && (afternoonStart == null || afternoonEnd == null)) {
            throw new IllegalArgumentException("Debes indicar inicio y fin para el tramo de tarde");
        }

        if (afternoonConfigured) {
            if (!afternoonStart.isBefore(afternoonEnd)) {
                throw new IllegalArgumentException("La tarde debe tener una hora de inicio anterior a la de fin");
            }
            if (afternoonStart.isBefore(morningEnd)) {
                throw new IllegalArgumentException("La tarde debe empezar despues de la manana");
            }
        }
    }

    private String formatTime(LocalTime time) {
        return time == null ? null : time.toString();
    }

    private BarberScheduleConfig buildDefaultConfig(User barber) {
        return BarberScheduleConfig.builder()
                .barber(barber)
                .morningStart(DEFAULT_MORNING_START)
                .morningEnd(DEFAULT_MORNING_END)
                .afternoonStart(DEFAULT_AFTERNOON_START)
                .afternoonEnd(DEFAULT_AFTERNOON_END)
                .build();
    }

    private User getCurrentUserOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new IllegalArgumentException("No autenticado");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
