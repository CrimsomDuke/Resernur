package com.resernur.api.controllers;

import com.resernur.api.utils.aspect.RequiresAnyRole;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {
    @GetMapping("/api")
    @RequiresAnyRole(roles = {"SOLICITANTE", "ADMINISTRADOR", "ENCARGADO"})
    public Map<String, String> home() {
        return Map.of(
                "message", "Bienvenido a la api de ReserNUR"
        );
    }

    //prueba sin roles
    @GetMapping("/api/test")
    public Map<String, String> test(){
        return Map.of(
                "message", "Bienvenido a la api de ReserNUR sin roles"
        );
    }
}
