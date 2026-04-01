package com.resernur.api.utils.aspect;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
// We will use this shit when needing to enforce a role requirement in an endpoint
//Por detras usa la logica del springboot pa conseguir los roles del JWT
@PreAuthorize("hasAnyRole(#roles)")
public @interface RequiresAnyRole {
    String[] roles() default {};
}
