package com.resernur.api.unittest.services.security;

import com.resernur.api.dtos.auth.LoginDTO;
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.pojos.TokenAuth;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.security.AuthService;
import com.resernur.api.services.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    public void register_validRequest_returnsTokenAuth() {
        // Arrange
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setFullName("John Doe");
        registerDTO.setEmail("john.doe@example.com");
        registerDTO.setPassword("password123");
        registerDTO.setRole(UserRole.SOLICITANTE);

        User user = User.builder()
                .fullName(registerDTO.getFullName())
                .email(registerDTO.getEmail())
                .password("encodedPassword")
                .role(registerDTO.getRole())
                .build();

        when(passwordEncoder.encode(registerDTO.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("mockJwtToken");

        // Act
        TokenAuth tokenAuth = authService.register(registerDTO);

        // Assert
        assertNotNull(tokenAuth);
        assertEquals("mockJwtToken", tokenAuth.token());
        verify(userRepository, times(1)).save(any(User.class));
        verify(jwtService, times(1)).generateToken(user);
    }

    @Test
    public void authenticate_validCredentials_returnsTokenAuth() {
        // Arrange
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail("john.doe@example.com");
        loginDTO.setPassword("password123");

        User user = User.builder()
                .email(loginDTO.getEmail())
                .password("encodedPassword")
                .build();

        when(userRepository.findByEmail(loginDTO.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("mockJwtToken");

        // Act
        TokenAuth tokenAuth = authService.authenticate(loginDTO);

        // Assert
        assertNotNull(tokenAuth);
        assertEquals("mockJwtToken", tokenAuth.token());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, times(1)).generateToken(user);
    }

    @Test
    public void authenticate_invalidCredentials_throwsException() {
        // Arrange
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail("invalid@example.com");
        loginDTO.setPassword("wrongPassword");

        when(userRepository.findByEmail(loginDTO.getEmail())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.authenticate(loginDTO));
        assertEquals("User not found", exception.getMessage());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, never()).generateToken(any(User.class));
    }
}
