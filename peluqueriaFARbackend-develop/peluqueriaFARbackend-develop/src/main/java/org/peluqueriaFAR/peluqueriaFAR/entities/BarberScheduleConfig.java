package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "barber_schedule_config")
public class BarberScheduleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "barber_id", nullable = false, unique = true)
    private User barber;

    @Column(name = "morning_start", nullable = false)
    private LocalTime morningStart;

    @Column(name = "morning_end", nullable = false)
    private LocalTime morningEnd;

    @Column(name = "afternoon_start")
    private LocalTime afternoonStart;

    @Column(name = "afternoon_end")
    private LocalTime afternoonEnd;
}
