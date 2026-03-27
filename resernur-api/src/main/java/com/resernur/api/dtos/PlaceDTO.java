package com.resernur.api.dtos;

import lombok.Data;

@Data
public class PlaceDTO {
    private int id;
    private String name;
    private String description;
    private int capacity;
    private int userInChargeId;

    // Getters and setters
}