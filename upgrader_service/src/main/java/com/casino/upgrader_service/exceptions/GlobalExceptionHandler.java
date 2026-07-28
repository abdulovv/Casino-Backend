package com.casino.upgrader_service.exceptions;

import com.casino.upgrader_service.dto.ApiErrorResponse;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final ObjectMapper objectMapper;

    public GlobalExceptionHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @ExceptionHandler({
            InvalidUpgradeTargetException.class,
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ApiErrorResponse> handleDependencyError(
            FeignException exception,
            HttpServletRequest request
    ) {
        String dependencyMessage = dependencyMessage(exception);

        return switch (exception.status()) {
            case 401 -> buildResponse(
                    HttpStatus.UNAUTHORIZED,
                    dependencyMessage,
                    request
            );
            case 403 -> buildResponse(
                    HttpStatus.FORBIDDEN,
                    dependencyMessage,
                    request
            );
            case 404 -> buildResponse(
                    HttpStatus.NOT_FOUND,
                    dependencyMessage,
                    request
            );
            case 400 -> buildResponse(
                    HttpStatus.BAD_REQUEST,
                    dependencyMessage,
                    request
            );
            case 409 -> buildResponse(
                    HttpStatus.CONFLICT,
                    dependencyMessage,
                    request
            );
            case -1 -> buildResponse(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    dependencyMessage,
                    request
            );
            default -> buildResponse(
                    HttpStatus.BAD_GATEWAY,
                    dependencyMessage,
                    request
            );
        };
    }

    private String dependencyMessage(FeignException exception) {
        String url = exception.request() == null
                ? ""
                : exception.request().url();
        String dependency = url.contains("/api/items/")
                ? "Сервис предметов"
                : "Сервис инвентаря";
        String detail = extractDependencyDetail(exception);

        if (exception.status() == -1) {
            return dependency + " недоступен";
        }
        if (detail == null || detail.isBlank()) {
            return dependency + " вернул ошибку HTTP " + exception.status();
        }
        return dependency + ": " + detail;
    }

    private String extractDependencyDetail(FeignException exception) {
        String body = exception.contentUTF8();
        if (body == null || body.isBlank()) {
            return null;
        }

        try {
            JsonNode error = objectMapper.readTree(body);
            JsonNode message = error.get("message");
            return message == null ? null : message.asText();
        } catch (Exception ignored) {
            return null;
        }
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
