package com.resernur.api.utils.aspect.aspectHandlers;

import com.resernur.api.utils.aspect.RequiresAnyRole;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class RoleCheckAspect {

    @Before("@annotation(requiresAnyRole)")
    public void checkRoles(RequiresAnyRole requiresAnyRole) {
        // 1. Get the current user's authorities from Spring Security
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new AccessDeniedException("No authenticated user");

        var userRoles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        // 2. Check if the user has ANY of the roles defined in your annotation
        boolean hasRole = Arrays.stream(requiresAnyRole.roles())
                .anyMatch(role -> userRoles.contains("ROLE_" + role));

        if (!hasRole) {
            throw new AccessDeniedException("No tienes los permisos necesarios para esta acción.");
        }
    }

}
