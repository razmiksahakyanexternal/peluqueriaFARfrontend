package org.peluqueriaFAR.peluqueriaFAR.repository;

import org.peluqueriaFAR.peluqueriaFAR.entities.BlockedSlot;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedSlotRepository extends JpaRepository<BlockedSlot, Long> {

    List<BlockedSlot> findByBarberAndBlockedDateBetweenOrderByBlockedDateAscStartTimeAsc(User barber, LocalDate start, LocalDate end);

    boolean existsByBarberAndBlockedDateAndAllDayTrue(User barber, LocalDate blockedDate);

    boolean existsByBarberAndBlockedDate(User barber, LocalDate blockedDate);

    boolean existsByBlockedDateAndAllDayTrue(LocalDate blockedDate);

    Optional<BlockedSlot> findByIdAndBarber(Long id, User barber);

    @Query("""
            select (count(bs) > 0) from BlockedSlot bs
            where bs.barber = :barber
              and bs.blockedDate = :blockedDate
              and bs.allDay = false
              and bs.startTime is not null
              and bs.endTime is not null
              and (:startTime < bs.endTime and :endTime > bs.startTime)
            """)
    boolean existsOverlappingPeriod(
            @Param("barber") User barber,
            @Param("blockedDate") LocalDate blockedDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("""
            select (count(bs) > 0) from BlockedSlot bs
            where bs.blockedDate = :blockedDate
              and (
                bs.allDay = true
                or (
                  bs.allDay = false
                  and bs.startTime is not null
                  and bs.endTime is not null
                  and (:startTime < bs.endTime and :endTime > bs.startTime)
                )
              )
            """)
    boolean existsBlockingAppointmentTime(
            @Param("blockedDate") LocalDate blockedDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
