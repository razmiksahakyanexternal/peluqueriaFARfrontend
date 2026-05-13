package org.peluqueriaFAR.peluqueriaFAR.service;

import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.AppointmentResponse;
import org.peluqueriaFAR.peluqueriaFAR.dto.CreateAppointmentRequest;
import org.peluqueriaFAR.peluqueriaFAR.entities.Appointment;
import org.peluqueriaFAR.peluqueriaFAR.entities.BarberScheduleConfig;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.peluqueriaFAR.peluqueriaFAR.repository.AppointmentRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.BlockedSlotRepository;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final BlockedSlotRepository blockedSlotRepository;
    private final UserRepository userRepository;
    private final WorkingDaysService workingDaysService;

    @Transactional
    public Appointment createAppointment(CreateAppointmentRequest request) {
        LocalDate today = LocalDate.now();
        if (request.getAppointmentDate().isBefore(today)) {
            throw new IllegalArgumentException("No se puede seleccionar una fecha anterior a hoy");
        }

        validateAppointmentInsideBarberSchedule(request.getAppointmentDate(), request.getStartTime());

        if (appointmentRepository.existsByAppointmentDateAndStartTime(
                request.getAppointmentDate(),
                request.getStartTime())) {
            throw new IllegalArgumentException("Ya existe una cita en esa franja horaria");
        }

        Appointment appointment = new Appointment();
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getStartTime().plusMinutes(15));

        if (blockedSlotRepository.existsBlockingAppointmentTime(
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime())) {
            throw new IllegalArgumentException("No se puede reservar una cita en un horario bloqueado");
        }

        appointment.setGuestName(request.getGuestName());
        appointment.setGuestPhone(request.getGuestPhone());

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId()).ifPresent(appointment::setUser);
        } else {
            String email = getCurrentUserEmail();
            if (email != null) {
                userRepository.findByEmail(email)
                        .or(() -> userRepository.findAll().stream()
                                .filter(candidate -> candidate.getEmail() != null
                                        && candidate.getEmail().equalsIgnoreCase(email))
                                .findFirst())
                        .ifPresent(appointment::setUser);
            }
        }

        return appointmentRepository.save(appointment);
    }

    @Transactional(readOnly = true)
    public List<String> getOccupiedStartTimes(LocalDate appointmentDate) {
        return appointmentRepository.findByAppointmentDate(appointmentDate).stream()
                .map(appointment -> appointment.getStartTime().toString())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments() {
        String email = getCurrentUserEmail();
        if (email == null) {
            return List.of();
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = userRepository.findAll().stream()
                    .filter(candidate -> candidate.getEmail() != null && candidate.getEmail().equalsIgnoreCase(email))
                    .findFirst()
                    .orElse(null);
        }
        if (user == null) {
            return List.of();
        }

        String guestName = buildGuestName(user);
        List<Appointment> appointments = guestName.isBlank()
                ? appointmentRepository.findByUser(user)
                : appointmentRepository.findVisibleAppointmentsForUser(user.getId(), guestName);

        return appointments.stream()
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).thenComparing(Appointment::getStartTime).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsInRange(LocalDate startDate, LocalDate endDate) {
        return appointmentRepository.findByAppointmentDateBetween(startDate, endDate).stream()
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).thenComparing(Appointment::getStartTime))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La cita no existe"));

        if (!canManageAppointment(appointment)) {
            throw new IllegalStateException("No tienes permiso para cancelar esta cita");
        }

        appointmentRepository.delete(appointment);
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .guestName(appointment.getGuestName())
                .guestPhone(appointment.getGuestPhone())
                .build();
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof String s) {
            return normalizeEmail(s);
        }
        return normalizeEmail(authentication.getName());
    }

    private String buildGuestName(User user) {
        String name = user.getName() == null ? "" : user.getName().trim();
        String surname = user.getSurname() == null ? "" : user.getSurname().trim();
        return (name + " " + surname).trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private boolean canManageAppointment(Appointment appointment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        boolean privilegedUser = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority().toUpperCase(Locale.ROOT))
                .anyMatch(authority -> authority.equals("ROLE_BARBER") || authority.equals("ROLE_ADMIN"));
        if (privilegedUser) {
            return true;
        }

        String email = getCurrentUserEmail();
        if (email == null) {
            return false;
        }

        User currentUser = userRepository.findByEmail(email)
                .or(() -> userRepository.findAll().stream()
                        .filter(candidate -> candidate.getEmail() != null
                                && candidate.getEmail().equalsIgnoreCase(email))
                        .findFirst())
                .orElse(null);
        if (currentUser == null) {
            return false;
        }

        if (appointment.getUser() != null && appointment.getUser().getId() != null
                && appointment.getUser().getId().equals(currentUser.getId())) {
            return true;
        }

        String guestName = buildGuestName(currentUser);
        return !guestName.isBlank()
                && appointment.getGuestName() != null
                && appointment.getGuestName().trim().equalsIgnoreCase(guestName);
    }

    private void validateAppointmentInsideBarberSchedule(LocalDate appointmentDate, LocalTime startTime) {
        if (!workingDaysService.getReservationWorkingDays().contains(appointmentDate.getDayOfWeek())) {
            throw new IllegalArgumentException("No se puede reservar una cita fuera de los dias laborables del peluquero");
        }

        LocalTime endTime = startTime.plusMinutes(15);
        BarberScheduleConfig config = workingDaysService.getReservationConfig();
        boolean inMorning = isInsideRange(startTime, endTime, config.getMorningStart(), config.getMorningEnd());
        boolean inAfternoon = isInsideRange(startTime, endTime, config.getAfternoonStart(), config.getAfternoonEnd());

        if (!inMorning && !inAfternoon) {
            throw new IllegalArgumentException("No se puede reservar una cita fuera del horario del peluquero");
        }
    }

    private boolean isInsideRange(LocalTime startTime, LocalTime endTime, LocalTime rangeStart, LocalTime rangeEnd) {
        return rangeStart != null
                && rangeEnd != null
                && !startTime.isBefore(rangeStart)
                && !endTime.isAfter(rangeEnd);
    }
}
