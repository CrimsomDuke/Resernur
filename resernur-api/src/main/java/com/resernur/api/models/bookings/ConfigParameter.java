package com.resernur.api.models.bookings;

import jakarta.persistence.*;
@Entity
public class ConfigParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String paramKey;

    private String paramValue;

    // Getters and setters
}