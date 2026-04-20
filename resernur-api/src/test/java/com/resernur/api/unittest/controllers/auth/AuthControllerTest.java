package com.resernur.api.unittest.controllers.auth;

import com.resernur.api.controllers.auth.AuthController;
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.pojos.TokenAuth;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.services.security.AuthService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Test
    public void testRegister(){

        //Arrange
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setEmail("johndoe@email");
        registerDTO.setPassword("test123");
        registerDTO.setFullName("Juan Doe");
        registerDTO.setRole(UserRole.SOLICITANTE);

        Mockito.when(authService.register(registerDTO))
                .thenReturn(new TokenAuth("fake-token"));

        //act
        ResponseEntity<TokenAuth> response = new AuthController(authService).register(registerDTO);
        Assertions.assertEquals(response.getStatusCode(), HttpStatus.OK);
        Mockito.verify(authService, Mockito.times(1)).register(registerDTO);

    }

    @Test
    public void testAuthenticate(){

        //Arrange
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setEmail("johndoe@email");
        registerDTO.setPassword("test123");
        registerDTO.setFullName("Juan Doe");
        registerDTO.setRole(UserRole.SOLICITANTE);

        Mockito.when(authService.authenticate(Mockito.any()))
                .thenReturn(new TokenAuth("fake-token"));

        //act
        ResponseEntity<TokenAuth> response = new AuthController(authService).authenticate(Mockito.any());
        Assertions.assertEquals(response.getStatusCode(), HttpStatus.OK);
        Mockito.verify(authService, Mockito.times(1)).authenticate(Mockito.any());
    }

}
