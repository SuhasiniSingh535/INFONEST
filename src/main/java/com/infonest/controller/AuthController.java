package com.infonest.controller;

import com.infonest.dto.*;
import com.infonest.service.AuthService;
import com.infonest.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private EmailService emailService;

    // Temporary storage in RAM
    private final Map<String, SignupRequest> pendingRequests = new ConcurrentHashMap<>();
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest request) {
        // Step 0: Validate before sending OTP
        String validationError = authService.validateSignupRequest(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(validationError);
        }

        // Step 1: Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        // Step 2: Store details in memory (DB entry nahi hogi yahan)
        pendingRequests.put(request.getEmail(), request);
        otpStorage.put(request.getEmail(), otp);

        // Step 3: Send Email using your sendEmail method
        String subject = "Infonest - Email Verification";
        String body = "Your verification code is: " + otp + "\nThis code is valid for 10 minutes.";
        emailService.sendEmail(request.getEmail(), subject, body);

        return ResponseEntity.ok("OTP_SENT");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (otpStorage.containsKey(email) && otpStorage.get(email).equals(otp)) {
            // OTP match! Now register in Database using your AuthService
            SignupRequest originalRequest = pendingRequests.get(email);
            String msg = authService.register(originalRequest);

            // Cleanup memory
            pendingRequests.remove(email);
            otpStorage.remove(email);

            return msg.contains("Error") ? ResponseEntity.badRequest().body(msg)
                    : ResponseEntity.ok("ACCOUNT_CREATED_SUCCESSFULLY");
        }
        return ResponseEntity.badRequest().body("Error: Invalid or Expired OTP");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}