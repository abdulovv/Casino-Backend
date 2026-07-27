package com.casino.store_service.exceptions;

import com.casino.store_service.dto.ApiErrorResponse;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ApiErrorResponse> handleFeignException(
            FeignException exception,
            HttpServletRequest request
    ) {
        return switch (exception.status()) {
            case 401 -> buildResponse(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid or expired token",
                    request
            );
            case 403 -> buildResponse(
                    HttpStatus.FORBIDDEN,
                    "Store request is forbidden",
                    request
            );
            case 404 -> buildResponse(
                    HttpStatus.NOT_FOUND,
                    "Item not found",
                    request
            );
            case 409 -> buildResponse(
                    HttpStatus.CONFLICT,
                    "Insufficient wallet balance",
                    request
            );
            case -1 -> buildResponse(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Store dependency is unavailable",
                    request
            );
            default -> buildResponse(
                    HttpStatus.BAD_GATEWAY,
                    "Store dependency request failed",
                    request
            );
        };
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {
        ApiErrorResponse response = new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(response);
    }
}
