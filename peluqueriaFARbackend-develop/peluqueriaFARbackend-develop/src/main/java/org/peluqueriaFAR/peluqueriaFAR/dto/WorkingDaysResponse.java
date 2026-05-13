package org.peluqueriaFAR.peluqueriaFAR.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.DayOfWeek;
import java.util.List;

@Data
@AllArgsConstructor
public class WorkingDaysResponse {
    private List<DayOfWeek> workingDays;
    private String morningStart;
    private String morningEnd;
    private String afternoonStart;
    private String afternoonEnd;
}
