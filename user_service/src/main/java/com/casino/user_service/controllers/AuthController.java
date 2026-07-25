package com.casino.user_service.controllers;

import com.casino.user_service.dto.LoginRequest;
import com.casino.user_service.dto.LoginResponse;
import com.casino.user_service.dto.RegisterRequest;
import com.casino.user_service.dto.RegisterResponse;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.services.AuthService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@RequestBody RegisterRequest request) {
        Long userId = authService.register(request);
        return new RegisterResponse(userId);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) throws UserNotFoundException {
        String token = authService.login(request).token();
        return new LoginResponse(token);
    }
}
