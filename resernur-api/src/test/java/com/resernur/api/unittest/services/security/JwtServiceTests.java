package com.resernur.api.unittest.services.security;

import com.resernur.api.models.enums.UserRole;
import com.resernur.api.services.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JwtServiceTests {

    @InjectMocks
    private JwtService jwtService;

    private final String secretKey = "mysecretkey123456789012345678901234567890madremiadelamorhermosoestalkeytienequeserlarguisima";
    private final long jwtExpiration = 3600000; // 1 hour

    @BeforeEach
    public void setUp() {
        // We use ReflectionTestUtils to inject values into the private fields of the @InjectMocks instance
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", jwtExpiration);
    }

    @Test
    void extractUsername_Success() {
        String token = jwtService.generateToken(createUserDetails("testuser"));
        String username = jwtService.extractUsername(token);
        assertEquals("testuser", username);
    }

    @Test
    void generateToken_Success() {
        UserDetails userDetails = createUserDetails("testuser");
        String token = jwtService.generateToken(userDetails);

        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3); // Valid JWT structure
    }

    @Test
    void isTokenValid_Success() {
        UserDetails userDetails = createUserDetails("testuser");
        String token = jwtService.generateToken(userDetails);

        boolean isValid = jwtService.isTokenValid(token, userDetails);
        assertTrue(isValid);
    }

    @Test
    void isTokenValid_DifferentUser_ReturnsFalse() {
        UserDetails user1 = createUserDetails("user1");
        UserDetails user2 = createUserDetails("user2");
        String token = jwtService.generateToken(user1);

        boolean isValid = jwtService.isTokenValid(token, user2);
        assertFalse(isValid);
    }

    @Test
    void isTokenExpired_ThrowsException() {
        // Set expiration to a negative value to force an immediate expired token
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -10000L);
        String token = jwtService.generateToken(createUserDetails("testuser"));

        // io.jsonwebtoken usually throws ExpiredJwtException when parsing an expired token
        assertThrows(ExpiredJwtException.class, () -> {
            jwtService.extractUsername(token);
        });
    }

    @Test
    void invalidSignature_ThrowsException() {
        String token = jwtService.generateToken(createUserDetails("testuser"));
        String tamperedToken = token + "modified";

        assertThrows(SignatureException.class, () -> {
            jwtService.extractUsername(tamperedToken);
        });
    }

    private UserDetails createUserDetails(String username) {
        return new User(
                username,
                "password",
                Collections.singletonList(new SimpleGrantedAuthority(UserRole.SOLICITANTE.toString()))
        );
    }
}
