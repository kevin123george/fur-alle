package de.fueralle.api.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    public static class DataNotReadyException extends RuntimeException {
        public DataNotReadyException(String msg) { super(msg); }
    }

    @ExceptionHandler(DataNotReadyException.class)
    public ResponseEntity<Map<String, String>> handleDataNotReady(DataNotReadyException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "data_not_ready", "message", ex.getMessage()));
    }
}
