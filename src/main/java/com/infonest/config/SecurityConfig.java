package com.infonest.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Auth endpoints open
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Allow public access to static pages (frontend will check role/client-side)
                        // ... existing matchers ...
                        .requestMatchers("/", "/index.html", "/login.html", "/signup.html", "/student_db.html",
                                        "/clubofficialdashboard.html", "/clubdashboard.html", "/indivisualclub.html",
                                        "/club_form.html", "/admin_db.html", "/css/**", "/js/**", "/*.js", "/*.html").permitAll()

                        // Add the schedule line here, making sure it ends with a closing parenthesis before the next dot
                        //.requestMatchers("/api/v1/office/schedule/**").hasRole("OFFICE")

                        .requestMatchers("/api/auth/forgot-password", "/error").permitAll()
                        // ... existing matchers ...
                        .requestMatchers("/api/auth/reset-password", "/error").permitAll()
                        // Public APIs
                        .requestMatchers("/api/v1/events/upcoming", "/api/v1/clubs/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/**").permitAll()
                        .requestMatchers("/api/v1/clubs/**").permitAll()
                        // Admin APIs
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // Faculty APIs
                        .requestMatchers("/api/v1/faculty/**").hasRole("FACULTY")
                        // Student/Registration APIs - allow all authenticated roles
                        .requestMatchers("/api/v1/student/**").hasAnyRole("STUDENT", "FACULTY", "ADMIN")
                        // Venue APIs — public for listing, authenticated for booking
                        .requestMatchers("/api/v1/venues/all", "/api/v1/venues/count").permitAll()
                        .requestMatchers("/api/v1/venues/**").authenticated()
                        // everything else authenticated

                        // ... existing static page and public API matchers ...

                        // --- START OF PROFESSIONAL SCHEDULE SECURITY ---
                        // 1. SPECIFIC endpoints for locator service (MUST be permitAll)
                        .requestMatchers("/api/v1/office/schedule/search/**").permitAll()
                        .requestMatchers("/api/v1/office/schedule/cabin/**").permitAll()

                        // 2. SPECIFIC endpoint for administrative upload (Strictly OFFICE role)
                        .requestMatchers("/api/v1/office/schedule/upload").hasRole("OFFICE")

                        // 3. Catch-all for any other office paths (Restrictive by default)
                        .requestMatchers("/api/v1/office/**").hasRole("OFFICE")
                        // --- END OF PROFESSIONAL SCHEDULE SECURITY ---

                        // 4. Final catch-all for anything else
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Use full origin(s) including scheme: e.g. http://localhost:3000
        configuration.setAllowedOrigins(
                Arrays.asList("http://localhost:3000", "https://infonest-backend.onrender.com", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}