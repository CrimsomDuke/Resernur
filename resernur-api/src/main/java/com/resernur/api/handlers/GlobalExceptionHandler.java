package com.resernur.api.handlers;

import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.StandardResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}