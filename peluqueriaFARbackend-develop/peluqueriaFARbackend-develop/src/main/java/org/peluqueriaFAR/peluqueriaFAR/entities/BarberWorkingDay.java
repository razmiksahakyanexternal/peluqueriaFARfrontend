package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "barber_working_days",
        uniqueConstraints = @UniqueConstraint(columnNames = {"barber_id", "day_of_week"})
)
public class BarberWorkingDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "barber_id", nullable = false)
    private User barber;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;
}
