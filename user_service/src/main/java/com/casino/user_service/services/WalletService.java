package com.casino.user_service.services;

import com.casino.user_service.dto.WalletResponse;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.exceptions.WalletNotFoundException;
import com.casino.user_service.repositories.WalletRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@AllArgsConstructor
@Service
public class WalletService {
    private final WalletRepository walletRepository;

    public WalletResponse findWalletByUserId(Long id) throws WalletNotFoundException {
        Optional<Wallet> walletOptional = walletRepository.findByUserId(id);
        Wallet wallet = walletOptional.orElseThrow(()-> new WalletNotFoundException(id));
        return WalletResponse.mapToResponse(wallet);
    }
}
