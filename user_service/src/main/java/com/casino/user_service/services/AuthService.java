package com.casino.user_service.services;

import com.casino.user_service.dto.LoginRequest;
import com.casino.user_service.dto.LoginResponse;
import com.casino.user_service.dto.RegisterRequest;
import com.casino.user_service.entities.User;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.entities.Role;
import com.casino.user_service.exceptions.IncorrectPasswordException;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.repositories.UserRepository;
import com.casino.user_service.repositories.WalletRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            WalletRepository walletRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public Long register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email уже занят");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);

        Wallet wallet = new Wallet();
        wallet.setUser(savedUser);
        walletRepository.save(wallet);

        return savedUser.getId();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) throws UserNotFoundException {
        Optional<User> optionalUser = userRepository.findByEmail(request.email());
        User user = optionalUser.orElseThrow(()-> new UserNotFoundException(request.email()));
        if (!passwordEncoder.matches(request.password(), user.getPassword())){
            throw new IncorrectPasswordException();
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token);
    }


}
