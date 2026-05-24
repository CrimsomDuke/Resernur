package com.resernur.api.handlers;

import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.StandardResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResernurException.class)
    public ResponseEntity<StandardResult<Void>> handleResernurException(ResernurException e){
        StandardResult<Void> result = new StandardResult<>();
        result.setErrorMessage(e.getErrorMessage());
        result.setSuccess(false);
        result.setData(null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<StandardResult<Void>> handleGenericException(Exception e) {
        StandardResult<Void> result = new StandardResult<>();

        result.setErrorMessage("An unexpected internal error occurred. Please try again later.");
        result.setSuccess(false);
        result.setData(null);

        if(e instanceof AccessDeniedException){
            result.setErrorMessage("No tienes los permisos necesarios para esta accion");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
        }

        if(e instanceof BadCredentialsException){
            result.setErrorMessage("Credenciales invalidas. Por favor verifica tu usuario y contraseña.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR) // Use 500 for unknown errors
                .body(result);
    }
}