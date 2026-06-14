package com.resernur.api.unittest.controllers.users;

import com.resernur.api.controllers.users.UserController;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.users.UserDTO;
import com.resernur.api.dtos.users.UserUpdateDTO;
import com.resernur.api.services.users.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserControllerTests {

    @Mock
    private UserService userService;
    @InjectMocks
    private UserController userController;
    private UserDTO userDTO;

    @BeforeEach
    public void setUp() {
        userDTO = new UserDTO();
        userDTO.setId(1L);
        userDTO.setEmail("test@test.com");
        userDTO.setFullName("Test User");
    }

    @Test
    public void getCurrentUser_Success() {
        StandardResult<UserDTO> result = new StandardResult<>(true, "", userDTO);
        when(userService.getMe(anyString())).thenReturn(result);
        var response = userController.getCurrentUser("Bearer token");
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(userDTO.getId(), response.getBody().getData().getId());
    }

    @Test
    public void getCurrentUser_Unauthorized() {
        StandardResult<UserDTO> result = new StandardResult<>(false, "Invalid token", null);
        when(userService.getMe(anyString())).thenReturn(result);
        var response = userController.getCurrentUser("Bearer token");
        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void getCurrentUser_NotFound() {
        StandardResult<UserDTO> result = new StandardResult<>(false, "User not found", null);
        when(userService.getMe(anyString())).thenReturn(result);
        var response = userController.getCurrentUser("Bearer token");
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void getCurrentUser_BadRequest() {
        StandardResult<UserDTO> result = new StandardResult<>(false, "Other error", null);
        when(userService.getMe(anyString())).thenReturn(result);
        var response = userController.getCurrentUser("Bearer token");
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void getById_Success() {
        StandardResult<UserDTO> result = new StandardResult<>(true, "", userDTO);
        when(userService.getById(eq(1L))).thenReturn(result);
        var response = userController.getById(1L);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(userDTO.getId(), response.getBody().getData().getId());
    }

    @Test
    public void getById_NotFound() {
        StandardResult<UserDTO> result = new StandardResult<>(false, "User not found", null);
        when(userService.getById(eq(1L))).thenReturn(result);
        var response = userController.getById(1L);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void getById_BadRequest() {
        StandardResult<UserDTO> result = new StandardResult<>(false, "Other error", null);
        when(userService.getById(eq(1L))).thenReturn(result);
        var response = userController.getById(1L);
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void update_Success() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        StandardResult<UserDTO> result = new StandardResult<>(true, "", userDTO);
        when(userService.update(any(UserUpdateDTO.class))).thenReturn(result);
        var response = userController.update(1L, dto);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(userDTO.getId(), response.getBody().getData().getId());
    }

    @Test
    public void update_BadRequest_NullDto() {
        var response = userController.update(1L, null);
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void update_NotFound() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        StandardResult<UserDTO> result = new StandardResult<>(false, "User not found", null);
        when(userService.update(any(UserUpdateDTO.class))).thenReturn(result);
        var response = userController.update(1L, dto);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void update_BadRequest_OtherError() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        StandardResult<UserDTO> result = new StandardResult<>(false, "Other error", null);
        when(userService.update(any(UserUpdateDTO.class))).thenReturn(result);
        var response = userController.update(1L, dto);
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void search_Success() {
        PagedResponse<UserDTO> paged = new PagedResponse<>();
        when(userService.search(anyString(), any())).thenReturn(paged);
        var response = userController.search("test", 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }
}
