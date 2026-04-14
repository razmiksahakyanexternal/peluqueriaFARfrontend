package org.peluqueriaFAR.peluqueriaFAR.entities;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"appointment_date", "start_time"})
})
public class Appointment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne
        @JoinColumn(name = "user_id")
        private User user;

        private String guestName;

        private String guestPhone;

        @Column(name = "appointment_date", nullable = false)
        private LocalDate appointmentDate;

        private LocalTime startTime;

        private LocalTime endTime;

        @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL)
        private EmailReminder emailReminder;

        // Getters y Setters
}

