package com.casino.user_service.controllers;

import com.casino.user_service.dto.LoginRequest;
import com.casino.user_service.dto.RegisterRequest;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.services.AuthService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)  //201-CREATED INSTEAD 200-OK
    public Map<String, Long> register(@RequestBody RegisterRequest request) {
        Long userId = authService.register(request);
        return Map.of("userId", userId);
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> login(@RequestBody LoginRequest request) throws UserNotFoundException {
        String token = authService.login(request).accessToken();
        return Map.of("token", token);
    }
}
