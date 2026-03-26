package com.resernur.api.services.security;

import com.resernur.api.dtos.auth.LoginDTO;
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.pojos.TokenAuth;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public TokenAuth register(RegisterDTO request) {
        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        repository.save(user);

        var jwtToken = jwtService.generateToken(user);
        return new TokenAuth(jwtToken);
    }

    public TokenAuth authenticate(LoginDTO request) {

        System.out.println("Se ejecuta authe");
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("Se ejecuta");

        var jwtToken = jwtService.generateToken(user);
        return new TokenAuth(jwtToken);
    }
}