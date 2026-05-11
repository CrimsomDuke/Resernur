package com.resernur.api.dtos.places;

import com.resernur.api.models.enums.PlaceStatus;
import lombok.Data;

@Data
public class PlaceDTO {
    private int id;
    private String name;
    private String description;
    private int capacity;
    private int userInChargeId;
    private PlaceStatus status;

    // Getters and setters
}