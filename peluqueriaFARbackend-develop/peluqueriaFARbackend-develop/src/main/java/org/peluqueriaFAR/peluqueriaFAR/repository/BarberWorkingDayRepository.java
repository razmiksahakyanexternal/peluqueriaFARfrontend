package org.peluqueriaFAR.peluqueriaFAR.repository;

import org.peluqueriaFAR.peluqueriaFAR.entities.BarberWorkingDay;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BarberWorkingDayRepository extends JpaRepository<BarberWorkingDay, Long> {
    List<BarberWorkingDay> findByBarber(User barber);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from BarberWorkingDay b where b.barber = :barber")
    int deleteByBarber(@Param("barber") User barber);
}
