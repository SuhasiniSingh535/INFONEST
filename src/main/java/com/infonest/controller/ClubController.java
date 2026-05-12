package com.infonest.controller;

import com.infonest.model.Club;
import com.infonest.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.infonest.model.Event;
import com.infonest.model.User;
import com.infonest.repository.EventRepository;
import com.infonest.repository.RegistrationRepository;
import com.infonest.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/clubs")
public class ClubController {

    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private RegistrationRepository registrationRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getClubFullDetails(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();

        // 1. Club Name aur ID fetch karein
        Club club = clubRepository.findById(id).orElse(null);
        response.put("club", club);

        // 2. Events fetch karein (Only visible events for public view)
        List<Event> events = eventRepository.findByClubIdAndHiddenFalse(id);

        // Logic to add registration count for each event
        List<Map<String, Object>> eventsWithCounts = events.stream().map(event -> {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("details", event);
            eventData.put("regCount", registrationRepository.countByEventId(event.getEventId()));
            return eventData;
        }).collect(Collectors.toList());

        response.put("events", eventsWithCounts);

        // 3. Faculty details (Users filtered by club_id)
        List<User> faculty = userRepository.findByClubId(id);
        response.put("faculty", faculty);

        // 4. Members — students who got approvalCount = 2 in recruitment events of this club
        List<Long> memberUserIds = registrationRepository.findMemberUserIdsByClubId(id);
        List<User> members = memberUserIds.isEmpty() ? List.of() : userRepository.findAllById(memberUserIds);
        response.put("members", members);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Club>> getAllClubs() {
        return ResponseEntity.ok(clubRepository.findAllByOrderByClubNameAsc());
    }
}