package com.resernur.api.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {
    @NotBlank(message = "Se requiere un email")
    private String email;
    @NotBlank(message = "Se requiere una contraseña")
    private String password;
}
