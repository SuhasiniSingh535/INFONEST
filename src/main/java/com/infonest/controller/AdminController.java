package com.infonest.controller;

import com.infonest.model.Club;
import com.infonest.model.Event;
import com.infonest.model.User;
import com.infonest.repository.ClubRepository;
import com.infonest.repository.EventRepository;
import com.infonest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    // ==================== CLUB MANAGEMENT ====================

    // 1. GET ALL CLUBS
    @GetMapping("/clubs")
    public ResponseEntity<List<Club>> getAllClubs() {
        return ResponseEntity.ok(clubRepository.findAll());
    }

    // 2. ADD NEW CLUB
    @PostMapping("/clubs/add")
    public ResponseEntity<String> addClub(@RequestBody Club club) {
        // Check if club ID already exists
        if (clubRepository.existsById(club.getClubId())) {
            return ResponseEntity.badRequest()
                    .body("Error: Club with ID '" + club.getClubId() + "' already exists!");
        }

        clubRepository.save(club);
        return ResponseEntity.ok("Club '" + club.getClubName() + "' added successfully!");
    }

    // 3. UPDATE CLUB
    @PutMapping("/clubs/{clubId}")
    public ResponseEntity<String> updateClub(@PathVariable String clubId, @RequestBody Club clubDetails) {
        Club club = clubRepository.findById(clubId)
                .orElse(null);

        if (club == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Club with ID '" + clubId + "' not found!");
        }

        club.setClubName(clubDetails.getClubName());
        club.setDescription(clubDetails.getDescription());
        clubRepository.save(club);

        return ResponseEntity.ok("Club updated successfully!");
    }

    // 4. DELETE CLUB
    @DeleteMapping("/clubs/{clubId}")
    public ResponseEntity<String> deleteClub(@PathVariable String clubId) {
        if (!clubRepository.existsById(clubId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Club with ID '" + clubId + "' not found!");
        }

        clubRepository.deleteById(clubId);
        return ResponseEntity.ok("Club deleted successfully!");
    }

    // ==================== EVENT MANAGEMENT ====================

    // 5. GET ALL EVENTS (including hidden)
    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    // 6. ADD EVENT (for any club)
    @PostMapping("/events/add")
    public ResponseEntity<String> addEvent(@RequestBody Event event) {
        // Validate club ID exists
        if (event.getClubId() == null || !clubRepository.existsById(event.getClubId())) {
            return ResponseEntity.badRequest()
                    .body("Error: Club with ID '" + event.getClubId() + "' does not exist!");
        }

        // Date validation: event_date must be >= today
        if (event.getEventDate() != null && event.getEventDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Error: Event date must be today or a future date!");
        }

        // Date validation: deadline must be before event_date
        if (event.getDeadline() != null && event.getEventDate() != null
                && !event.getDeadline().isBefore(event.getEventDate())) {
            return ResponseEntity.badRequest()
                    .body("Error: Registration deadline must be before the event date!");
        }

        // Set default hidden to false if not specified
        if (event.getHidden() == null) {
            event.setHidden(false);
        }

        // Set default eventType if not specified
        if (event.getEventType() == null) {
            event.setEventType("NON_RECRUITMENT");
        }

        // If recruitment event, force internal form
        if ("RECRUITMENT".equals(event.getEventType())) {
            event.setRegistrationFormLink("club_form_link");
        }

        eventRepository.save(event);
        return ResponseEntity.ok("Event '" + event.getEventName() + "' added successfully!");
    }

    // 7. UPDATE EVENT
    @PutMapping("/events/{eventId}")
    public ResponseEntity<String> updateEvent(@PathVariable Long eventId, @RequestBody Event eventDetails) {
        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Event with ID '" + eventId + "' not found!");
        }

        // If changing club ID, validate it exists
        if (eventDetails.getClubId() != null && !clubRepository.existsById(eventDetails.getClubId())) {
            return ResponseEntity.badRequest()
                    .body("Error: Club with ID '" + eventDetails.getClubId() + "' does not exist!");
        }

        // Date validations
        if (eventDetails.getEventDate() != null && eventDetails.getEventDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Error: Event date must be today or a future date!");
        }

        if (eventDetails.getDeadline() != null && eventDetails.getEventDate() != null
                && !eventDetails.getDeadline().isBefore(eventDetails.getEventDate())) {
            return ResponseEntity.badRequest()
                    .body("Error: Registration deadline must be before the event date!");
        }

        // Update all fields
        event.setClubId(eventDetails.getClubId());
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
        return ResponseEntity.ok("Event updated successfully!");
    }

    // 8. DELETE EVENT
    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<String> deleteEvent(@PathVariable Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Event with ID '" + eventId + "' not found!");
        }

        eventRepository.deleteById(eventId);
        return ResponseEntity.ok("Event deleted successfully!");
    }

    // 9. HIDE/UNHIDE EVENT (Toggle visibility)
    @PutMapping("/events/{eventId}/toggle-visibility")
    public ResponseEntity<String> toggleEventVisibility(@PathVariable Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Event with ID '" + eventId + "' not found!");
        }

        // Toggle hidden status
        boolean newStatus = !Boolean.TRUE.equals(event.getHidden());
        event.setHidden(newStatus);
        eventRepository.save(event);

        String statusText = newStatus ? "hidden" : "visible";
        return ResponseEntity.ok("Event is now " + statusText + "!");
    }

    // 10. SET EVENT VISIBILITY (explicit hide/show)
    @PutMapping("/events/{eventId}/visibility")
    public ResponseEntity<String> setEventVisibility(@PathVariable Long eventId, @RequestParam boolean hidden) {
        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: Event with ID '" + eventId + "' not found!");
        }

        event.setHidden(hidden);
        eventRepository.save(event);

        String statusText = hidden ? "hidden" : "visible";
        return ResponseEntity.ok("Event is now " + statusText + "!");
    }

    // ==================== CLUB OFFICIAL MANAGEMENT ====================

    // 11. GET CLUB OFFICIALS BY CLUB ID
    @GetMapping("/officials/{clubId}")
    public ResponseEntity<List<User>> getClubOfficials(@PathVariable String clubId) {
        return ResponseEntity.ok(userRepository.findByClubId(clubId));
    }

    // 12. GET ALL FACULTY USERS
    @GetMapping("/faculty")
    public ResponseEntity<List<User>> getAllFaculty() {
        return ResponseEntity.ok(userRepository.findByRole("FACULTY"));
    }

    // 13. ASSIGN FACULTY TO CLUB (by email)
    @PutMapping("/officials/assign")
    public ResponseEntity<String> assignFacultyToClub(@RequestParam String email, @RequestParam String clubId) {
        // Find user by email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: User with email '" + email + "' not found!");
        }

        // Check if user is FACULTY
        if (!"FACULTY".equals(user.getRole())) {
            return ResponseEntity.badRequest()
                    .body("Error: User must be a FACULTY member to assign to a club!");
        }

        // Validate club exists
        if (!clubRepository.existsById(clubId)) {
            return ResponseEntity.badRequest()
                    .body("Error: Club with ID '" + clubId + "' does not exist!");
        }

        // Assign club
        user.setClubId(clubId);
        userRepository.save(user);

        return ResponseEntity.ok(
                "Faculty '" + user.getFirstName() + " " + user.getLastName() + "' assigned to club '" + clubId + "'!");
    }

    // 14. REMOVE FACULTY FROM CLUB (clear clubId)
    @PutMapping("/officials/remove")
    public ResponseEntity<String> removeFacultyFromClub(@RequestParam String email) {
        // Find user by email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: User with email '" + email + "' not found!");
        }

        // Check if user is FACULTY
        if (!"FACULTY".equals(user.getRole())) {
            return ResponseEntity.badRequest()
                    .body("Error: User is not a FACULTY member!");
        }

        String previousClub = user.getClubId();
        user.setClubId(null);
        userRepository.save(user);

        return ResponseEntity.ok("Faculty '" + user.getFirstName() + " " + user.getLastName() + "' removed from club '"
                + previousClub + "'!");
    }
}
