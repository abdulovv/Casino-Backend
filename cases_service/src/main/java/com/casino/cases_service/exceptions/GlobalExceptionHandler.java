package com.casino.cases_service.exceptions;

import com.casino.cases_service.dto.ApiErrorResponse;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GameCaseNotFound.class)
    public ResponseEntity<ApiErrorResponse> handleGameCaseNotFound(
            GameCaseNotFound exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, exception, request);
    }

    @ExceptionHandler(EmptyGameCaseException.class)
    public ResponseEntity<ApiErrorResponse> handleEmptyGameCase(
            EmptyGameCaseException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, exception, request);
    }

    @ExceptionHandler({
            InvalidCaseConfigurationException.class,
            InvalidImageException.class,
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(ImageNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleImageNotFound(
            ImageNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<ApiErrorResponse> handleImageStorage(
            ImageStorageException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONTENT_TOO_LARGE,
                "Image must not exceed 5 MB",
                request
        );
    }

    @ExceptionHandler({
            IncorrectTotalCaseItemsWeight.class,
            IncorrectSelectRewardAlgorithmException.class
    })
    public ResponseEntity<ApiErrorResponse> handleCaseConfigurationError(
            RuntimeException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, exception, request);
    }

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
            case 409 -> buildResponse(
                    HttpStatus.CONFLICT,
                    "Insufficient wallet balance",
                    request
            );
            case -1 -> buildResponse(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "User service is unavailable",
                    request
            );
            default -> buildResponse(
                    HttpStatus.BAD_GATEWAY,
                    "User service request failed",
                    request
            );
        };
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            RuntimeException exception,
            HttpServletRequest request
    ) {
        return buildResponse(status, exception.getMessage(), request);
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
