package com.resernur.api.services.users;

import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.users.UserDTO;
import com.resernur.api.dtos.users.UserUpdateDTO;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Get user by id
    public StandardResult<UserDTO> getById(Long id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "User not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    // Update user (partial): allow updating fullName and password
    @Transactional
    public StandardResult<UserDTO> update(UserUpdateDTO dto) {
        if (dto == null || dto.getId() == null) return new StandardResult<>(false, "Invalid payload", null);
        Optional<User> opt = userRepository.findById(dto.getId());
        if (opt.isEmpty()) return new StandardResult<>(false, "User not found", null);
        User user = opt.get();
        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        User saved = userRepository.save(user);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Search users by email or fullName (paged)
    public PagedResponse<UserDTO> search(String term, SearchQuery query) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<User> pageResult = userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(term == null ? "" : term, term == null ? "" : term, pageable);
        var content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    // Get current user from Authorization header value ("Bearer <token>")
    public StandardResult<UserDTO> getMe(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return new StandardResult<>(false, "Invalid Authorization header", null);
        }
        String token = authorizationHeader.substring("Bearer ".length()).trim();
        String email;
        try {
            email = jwtService.extractUsername(token);
        } catch (Exception ex) {
            return new StandardResult<>(false, "Invalid token", null);
        }
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) return new StandardResult<>(false, "User not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    private UserDTO toDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setRole(u.getRole());
        return dto;
    }

}
