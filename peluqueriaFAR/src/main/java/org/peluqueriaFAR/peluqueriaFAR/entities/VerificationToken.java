package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_tokens")
public class VerificationToken {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(unique = true, nullable = false)
        private String token;

        private LocalDateTime expiresAt;

        private LocalDateTime usedAt;

        // Getters y Setters
    }
