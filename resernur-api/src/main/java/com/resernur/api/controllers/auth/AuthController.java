package com.resernur.api.controllers.auth;

import com.resernur.api.dtos.auth.LoginDTO;
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.pojos.TokenAuth;
import com.resernur.api.services.security.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<TokenAuth> register(
            @Valid @RequestBody RegisterDTO request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenAuth> authenticate(
            @Valid @RequestBody LoginDTO request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }
}