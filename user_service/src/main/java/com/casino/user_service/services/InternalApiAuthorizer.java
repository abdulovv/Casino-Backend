package com.casino.user_service.services;

import com.casino.user_service.exceptions.InvalidInternalTokenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class InternalApiAuthorizer {
    private final byte[] expectedToken;

    public InternalApiAuthorizer(
            @Value("${services.internal-token}") String expectedToken
    ) {
        this.expectedToken = expectedToken.getBytes(StandardCharsets.UTF_8);
    }

    public void authorize(String actualToken) {
        if (actualToken == null || !MessageDigest.isEqual(
                expectedToken,
                actualToken.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new InvalidInternalTokenException();
        }
    }
}
