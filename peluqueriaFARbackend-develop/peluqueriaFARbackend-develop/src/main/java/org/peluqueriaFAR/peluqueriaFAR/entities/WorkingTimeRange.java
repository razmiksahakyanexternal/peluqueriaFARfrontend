package org.peluqueriaFAR.peluqueriaFAR.entities;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "working_time_ranges")
public class WorkingTimeRange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DayOfWeek dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;

    public enum DayOfWeek {
        LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
    }

    // Getters y Setters
}
