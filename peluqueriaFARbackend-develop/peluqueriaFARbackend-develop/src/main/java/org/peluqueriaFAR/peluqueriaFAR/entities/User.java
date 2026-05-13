package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import org.peluqueriaFAR.peluqueriaFAR.model.Role;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;

        private String surname;

        @Column(unique = true)
        private String email;

        private String mobilePhone;

        private String passwordHash;

        @Enumerated(EnumType.STRING)
        private Role role;

        @Enumerated(EnumType.STRING)
        private AuthProvider authProvider;

        @Builder.Default
        private Boolean enabled = false;

        @Builder.Default
        private Boolean active = true;

        @Builder.Default
        private LocalDateTime createdAt = LocalDateTime.now();

        // Relaciones
        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
        public List<VerificationToken> verificationTokens;

        @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
        private List<Appointment> appointments;

        public enum AuthProvider {
            LOCAL, GOOGLE
        }

}
