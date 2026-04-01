package com.resernur.api.dtos.users;

import com.resernur.api.models.enums.UserRole;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private UserRole role;
}

