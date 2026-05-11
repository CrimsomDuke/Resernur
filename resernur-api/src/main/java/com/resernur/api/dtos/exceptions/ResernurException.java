package com.resernur.api.dtos.exceptions;

import lombok.Data;

@Data
public class ResernurException extends RuntimeException {
    public String ErrorMessage;

    public ResernurException(String message){
        this.ErrorMessage = message;
    }

}
