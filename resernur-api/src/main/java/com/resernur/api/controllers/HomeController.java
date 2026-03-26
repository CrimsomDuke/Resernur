package com.resernur.api.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {
    @GetMapping("/api/")
    public Map<String, String> home() {
        throw new UnsupportedOperationException("Not supported yet.");

    }
}
