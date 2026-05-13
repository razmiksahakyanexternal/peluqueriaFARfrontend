package org.peluqueriaFAR.peluqueriaFAR.repository;

import org.peluqueriaFAR.peluqueriaFAR.entities.BarberScheduleConfig;
import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BarberScheduleConfigRepository extends JpaRepository<BarberScheduleConfig, Long> {
    Optional<BarberScheduleConfig> findByBarber(User barber);
}
