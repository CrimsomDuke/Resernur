package com.resernur.api.integrationtests.auth;

import com.resernur.api.dtos.auth.LoginDTO;
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.security.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@ActiveProfiles("test") //Esta wea es pa que el springbu use el application-test.properties
@Transactional
public class AuthIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setup(){

        userRepository.deleteAll();

        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setEmail("admin@gmail.com");
        registerDTO.setPassword("admin123");
        registerDTO.setFullName("Admin Admin");
        registerDTO.setRole(UserRole.ADMINISTRADOR);
        authService.register(registerDTO);
    }

    @Test
    public void testLoginSuccess() throws Exception {
        LoginDTO dto = new LoginDTO();

        dto.setEmail("admin@gmail.com");
        dto.setPassword("admin123");

        var response = authService.authenticate(dto);

        assertNotNull(response.token());
        assertTrue(response.token().length() > 10);
    }

}
