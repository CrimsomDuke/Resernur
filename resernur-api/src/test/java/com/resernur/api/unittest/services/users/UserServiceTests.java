package com.resernur.api.unittest.services.users;

import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.users.UserDTO;
import com.resernur.api.dtos.users.UserUpdateDTO;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.security.JwtService;
import com.resernur.api.services.users.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTests {
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    public void setup() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setRole(UserRole.SOLICITANTE);
        user.setPassword("pass");
    }

    @Test
    public void getById_found_returnsUserDTO() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        StandardResult<UserDTO> result = userService.getById(1L);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(user.getEmail(), result.getData().getEmail());
    }

    @Test
    public void getById_notFound_returnsFailure() {
        when(userRepository.findById(2L)).thenReturn(Optional.empty());
        StandardResult<UserDTO> result = userService.getById(2L);
        assertFalse(result.isSuccess());
        assertNull(result.getData());
        assertEquals("User not found", result.getErrorMessage());
    }

    @Test
    public void update_validFullNameAndPassword_updatesUser() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        dto.setFullName("Updated Name");
        dto.setPassword("newpass");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);
        StandardResult<UserDTO> result = userService.update(dto);
        assertTrue(result.isSuccess());
        assertEquals("Updated Name", result.getData().getFullName());
        verify(passwordEncoder).encode("newpass");
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void update_onlyFullName_updatesUser() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        dto.setFullName("Updated Name");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        StandardResult<UserDTO> result = userService.update(dto);
        assertTrue(result.isSuccess());
        assertEquals("Updated Name", result.getData().getFullName());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void update_onlyPassword_updatesUser() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(1L);
        dto.setPassword("newpass");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);
        StandardResult<UserDTO> result = userService.update(dto);
        assertTrue(result.isSuccess());
        verify(passwordEncoder).encode("newpass");
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void update_invalidPayload_returnsFailure() {
        StandardResult<UserDTO> result = userService.update(null);
        assertFalse(result.isSuccess());
        assertEquals("Invalid payload", result.getErrorMessage());
        assertNull(result.getData());
    }

    @Test
    public void update_userNotFound_returnsFailure() {
        UserUpdateDTO dto = new UserUpdateDTO();
        dto.setId(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.empty());
        StandardResult<UserDTO> result = userService.update(dto);
        assertFalse(result.isSuccess());
        assertEquals("User not found", result.getErrorMessage());
        assertNull(result.getData());
    }

    @Test
    public void search_users_returnsPagedResponse() {
        SearchQuery query = new SearchQuery();
        query.page = 0;
        query.pageSize = 10;
        Page<User> page = new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1);
        when(userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(anyString(), anyString(), any())).thenReturn(page);
        PagedResponse<UserDTO> response = userService.search("test", query);
        assertTrue(response.isSuccess());
        assertEquals(1, response.getContent().size());
        assertEquals(user.getEmail(), response.getContent().get(0).getEmail());
    }

    @Test
    public void getMe_validToken_returnsUserDTO() {
        String token = "Bearer validtoken";
        when(jwtService.extractUsername("validtoken")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        StandardResult<UserDTO> result = userService.getMe(token);
        assertTrue(result.isSuccess());
        assertEquals(user.getEmail(), result.getData().getEmail());
    }

    @Test
    public void getMe_invalidHeader_returnsFailure() {
        StandardResult<UserDTO> result = userService.getMe(null);
        assertFalse(result.isSuccess());
        assertEquals("Invalid Authorization header", result.getErrorMessage());
        result = userService.getMe("InvalidHeader");
        assertFalse(result.isSuccess());
        assertEquals("Invalid Authorization header", result.getErrorMessage());
    }

    @Test
    public void getMe_invalidToken_returnsFailure() {
        String token = "Bearer invalidtoken";
        when(jwtService.extractUsername("invalidtoken")).thenThrow(new RuntimeException("bad token"));
        StandardResult<UserDTO> result = userService.getMe(token);
        assertFalse(result.isSuccess());
        assertEquals("Invalid token", result.getErrorMessage());
    }

    @Test
    public void getMe_userNotFound_returnsFailure() {
        String token = "Bearer validtoken";
        when(jwtService.extractUsername("validtoken")).thenReturn("notfound@example.com");
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        StandardResult<UserDTO> result = userService.getMe(token);
        assertFalse(result.isSuccess());
        assertEquals("User not found", result.getErrorMessage());
    }
}
