package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "email_reminders")
public class EmailReminder {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @OneToOne
        @JoinColumn(name = "appointment_id", nullable = false)
        private Appointment appointment;

        private LocalDateTime scheduleSend;

        private Boolean sent = false;

        private LocalDateTime sentAt;

        // Getters y Setters
    }


