package com.casino.user_service.services;

import com.casino.user_service.dto.WalletResponse;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.exceptions.InsufficientBalanceException;
import com.casino.user_service.exceptions.WalletNotFoundException;
import com.casino.user_service.repositories.WalletRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@AllArgsConstructor
@Service
public class WalletService {
    private final WalletRepository walletRepository;

    public WalletResponse findWalletByUserId(Long userId) throws WalletNotFoundException {
        Optional<Wallet> walletOptional = walletRepository.findByUserId(userId);
        Wallet wallet = walletOptional.orElseThrow(()-> new WalletNotFoundException(userId));
        return WalletResponse.mapToResponse(wallet);
    }

    @Transactional
    public WalletResponse debit(Long userId, Long amount) throws WalletNotFoundException {
        Optional<Wallet> walletOptional = walletRepository.findByUserIdForUpdate(userId);
        Wallet wallet = walletOptional.orElseThrow(()-> new WalletNotFoundException(userId));
        Long balance = wallet.getBalance();
        if (balance < amount){
            throw new InsufficientBalanceException(balance, amount);
        }
        wallet.decreaseBalance(amount);
        walletRepository.save(wallet);
        return WalletResponse.mapToResponse(wallet);
    }
}
