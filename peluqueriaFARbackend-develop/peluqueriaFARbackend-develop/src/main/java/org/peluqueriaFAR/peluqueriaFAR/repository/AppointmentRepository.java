package org.peluqueriaFAR.peluqueriaFAR.repository;

import org.peluqueriaFAR.peluqueriaFAR.entities.Appointment;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	List<Appointment> findByAppointmentDate(LocalDate appointmentDate);
	List<Appointment> findByAppointmentDateBetween(LocalDate startDate, LocalDate endDate);
	List<Appointment> findByUser(User user);
	boolean existsByAppointmentDateAndStartTime(LocalDate appointmentDate, LocalTime startTime);

    @Query("""
            SELECT DISTINCT a FROM Appointment a
            WHERE a.user.id = :userId
               OR LOWER(TRIM(COALESCE(a.guestName, ''))) = LOWER(TRIM(:guestName))
            """)
    List<Appointment> findVisibleAppointmentsForUser(@Param("userId") Long userId, @Param("guestName") String guestName);
}
