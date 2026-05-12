
package com.infonest.controller;

import com.infonest.model.Event;
import com.infonest.model.Registration;
import com.infonest.repository.EventRepository;
import com.infonest.repository.RegistrationRepository;
import com.infonest.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty")
public class ClubOfficialController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private com.infonest.repository.ClubRepository clubRepository;

    @Autowired
    private JwtUtils jwtUtils;

    // Helper method to extract clubId from JWT token
    private String getClubIdFromToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtils.extractClubId(token);
        }
        return null;
    }

    // 1. ADD EVENT - Only to faculty's own club
    @PostMapping("/add-event")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<String> addEvent(@RequestBody Event event,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        // Security check: Faculty can only add events to their own club
        if (facultyClubId == null || !facultyClubId.equals(event.getClubId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only add events to your own club!");
        }

        // Date validation: event_date must be >= today
        if (event.getEventDate() != null && event.getEventDate().isBefore(java.time.LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Error: Event date must be today or a future date!");
        }

        // Date validation: deadline must be before event_date
        if (event.getDeadline() != null && event.getEventDate() != null
                && !event.getDeadline().isBefore(event.getEventDate())) {
            return ResponseEntity.badRequest()
                    .body("Error: Registration deadline must be before the event date!");
        }

        // If recruitment event, force internal form
        if ("RECRUITMENT".equals(event.getEventType())) {
            event.setRegistrationFormLink("club_form_link");
        }

        // Set defaults
        if (event.getEventType() == null) {
            event.setEventType("NON_RECRUITMENT");
        }

        // Ensure new events are visible by default
        event.setHidden(false);

        eventRepository.save(event);
        return ResponseEntity.ok("Event added successfully!");
    }

    // 2. FETCH EVENT BY NAME (For Placeholders)
    @GetMapping("/event-details/{clubId}/{eventName}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> getEventDetails(@PathVariable String clubId,
            @PathVariable String eventName,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        // Security check: Faculty can only view their own club's events for editing
        if (facultyClubId == null || !facultyClubId.equals(clubId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only access your own club's events!");
        }

        Event event = eventRepository.findByClubIdAndEventName(clubId, eventName)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return ResponseEntity.ok(event);
    }

    // 3. UPDATE EVENT - Only faculty's own club's events
    @PutMapping("/update-event/{eventId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<String> updateEvent(@PathVariable Long eventId,
            @RequestBody Event eventDetails,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Security check: Faculty can only update their own club's events
        if (facultyClubId == null || !facultyClubId.equals(event.getClubId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only update your own club's events!");
        }

        // Date validation: event_date must be >= today
        if (eventDetails.getEventDate() != null && eventDetails.getEventDate().isBefore(java.time.LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Error: Event date must be today or a future date!");
        }

        // Date validation: deadline must be before event_date
        if (eventDetails.getDeadline() != null && eventDetails.getEventDate() != null
                && !eventDetails.getDeadline().isBefore(eventDetails.getEventDate())) {
            return ResponseEntity.badRequest()
                    .body("Error: Registration deadline must be before the event date!");
        }

        // Updating all fields as per table structure
        event.setEventName(eventDetails.getEventName());
        event.setDescription(eventDetails.getDescription());
        event.setVenueId(eventDetails.getVenueId());
        event.setEventDate(eventDetails.getEventDate());
        event.setEventTime(eventDetails.getEventTime());
        event.setDeadline(eventDetails.getDeadline());
        event.setEventType(eventDetails.getEventType() != null ? eventDetails.getEventType() : "NON_RECRUITMENT");
        event.setCustomFormFields(eventDetails.getCustomFormFields());

        // If recruitment event, force internal form
        if ("RECRUITMENT".equals(event.getEventType())) {
            event.setRegistrationFormLink("club_form_link");
        } else {
            event.setRegistrationFormLink(eventDetails.getRegistrationFormLink());
        }

        eventRepository.save(event);
        return ResponseEntity.ok("Event details updated successfully!");
    }

    // 4. DELETE EVENT - Only faculty's own club's events
    @DeleteMapping("/delete-event/{eventId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<String> deleteEvent(@PathVariable Long eventId,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Security check: Faculty can only delete their own club's events
        if (facultyClubId == null || !facultyClubId.equals(event.getClubId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only delete your own club's events!");
        }

        eventRepository.deleteById(eventId);
        return ResponseEntity.ok("Event deleted successfully!");
    }

    // 5. VIEW SUBMISSIONS - Only faculty's own club
    @GetMapping("/submissions/{clubId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> getClubSubmissions(@PathVariable String clubId,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        // Security check: Faculty can only view their own club's submissions
        if (facultyClubId == null || !facultyClubId.equals(clubId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only view your own club's submissions!");
        }

        return ResponseEntity.ok(registrationRepository.findAllByClubId(clubId));
    }

    // 6. UPDATE STATUS (Approve/Reject) - Multi-stage for RECRUITMENT events
    @PutMapping("/update-status/{regId}")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<String> updateStatus(@PathVariable Long regId,
            @RequestParam String status,
            @RequestHeader("Authorization") String authHeader) {
        Registration reg = registrationRepository.findById(regId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        // Check if already finalized (SELECTED or REJECTED) - prevent re-action
        String currentStatus = reg.getStatus();
        if ("SELECTED".equals(currentStatus) || "REJECTED".equals(currentStatus)) {
            return ResponseEntity.badRequest()
                    .body("Error: This registration has already been " + currentStatus
                            + ". Decision cannot be changed!");
        }

        // Get the event to check club ownership
        Event event = eventRepository.findById(reg.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        String facultyClubId = getClubIdFromToken(authHeader);

        // Security check: Faculty can only update status for their own club's events
        if (facultyClubId == null || !facultyClubId.equals(event.getClubId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: You can only manage registrations for your own club's events!");
        }

        boolean isRecruitment = "RECRUITMENT".equals(event.getEventType());

        if ("REJECTED".equals(status)) {
            // Reject at any stage
            reg.setStatus("REJECTED");
            registrationRepository.save(reg);
            return ResponseEntity.ok("Registration rejected.");
        }

        if (isRecruitment) {
            // Multi-stage approval for RECRUITMENT events
            int currentCount = reg.getApprovalCount() != null ? reg.getApprovalCount() : 0;
            if (currentCount == 0) {
                // First approval: APPLIED -> SHORTLISTED
                reg.setApprovalCount(1);
                reg.setStatus("SHORTLISTED");
                registrationRepository.save(reg);
                return ResponseEntity.ok("Student shortlisted for further rounds (Stage 1).");
            } else if (currentCount == 1) {
                // Second approval: SHORTLISTED -> SELECTED (member)
                reg.setApprovalCount(2);
                reg.setStatus("SELECTED");
                registrationRepository.save(reg);
                return ResponseEntity.ok("Student selected as club member (Stage 2 - Final)!");
            } else {
                return ResponseEntity.badRequest().body("Error: Student is already fully approved.");
            }
        } else {
            // Single-stage approval for NON_RECRUITMENT events
            reg.setStatus("APPROVED");
            reg.setApprovalCount(1);
            registrationRepository.save(reg);
            return ResponseEntity.ok("Registration approved.");
        }
    }

    // 7. GET ALL EVENTS FOR FACULTY'S CLUB
    @GetMapping("/my-events")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> getMyClubEvents(@RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        if (facultyClubId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: Club ID not found in token!");
        }

        List<Event> events = eventRepository.findByClubId(facultyClubId);
        return ResponseEntity.ok(events);
    }

    // 8. UPDATE CLUB DESCRIPTION - Only faculty's own club
    @PutMapping("/update-club-description")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> updateClubDescription(@RequestBody java.util.Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        if (facultyClubId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: Club ID not found in token!");
        }

        String newDescription = payload.get("description");
        if (newDescription == null) {
            return ResponseEntity.badRequest().body("Error: Description is required!");
        }

        // Find and update the club
        com.infonest.model.Club club = clubRepository.findById(facultyClubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        club.setDescription(newDescription);
        clubRepository.save(club);

        return ResponseEntity.ok("Club description updated successfully!");
    }

    // 9. GET CLUB DETAILS - For faculty to see current description
    @GetMapping("/my-club")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> getMyClub(@RequestHeader("Authorization") String authHeader) {
        String facultyClubId = getClubIdFromToken(authHeader);

        if (facultyClubId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Error: Club ID not found in token!");
        }

        com.infonest.model.Club club = clubRepository.findById(facultyClubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        return ResponseEntity.ok(club);
    }
}