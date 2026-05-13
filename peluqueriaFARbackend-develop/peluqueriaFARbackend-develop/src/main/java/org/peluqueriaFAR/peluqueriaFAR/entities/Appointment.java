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

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }

        public String getGuestName() { return guestName; }
        public void setGuestName(String guestName) { this.guestName = guestName; }

        public String getGuestPhone() { return guestPhone; }
        public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

        public LocalDate getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

        public EmailReminder getEmailReminder() { return emailReminder; }
        public void setEmailReminder(EmailReminder emailReminder) { this.emailReminder = emailReminder; }
}