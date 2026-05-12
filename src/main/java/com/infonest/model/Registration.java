package com.infonest.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "registrations")
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long regId;

    private Long eventId;
    
    // User table ki ID (student/faculty/admin)
    private Long userId; 
    
    private String status="APPLIED"; // APPLIED, SHORTLISTED, SELECTED, REJECTED

    @Column(nullable = true)
    private Integer approvalCount = 0; // 0=applied, 1=shortlisted, 2=selected (member)

    @Column(columnDefinition = "TEXT")
    private String formData; // JSON string for recruitment details
    
    private LocalDateTime submissionDate;
}