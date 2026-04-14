package org.peluqueriaFAR.peluqueriaFAR.entities;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.time.LocalTime;

public class BlockedSlot {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate blockedDate;

    private LocalTime startTime;

    private LocalTime endTime;

}

