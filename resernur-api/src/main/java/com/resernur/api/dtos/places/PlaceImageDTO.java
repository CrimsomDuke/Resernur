package com.resernur.api.dtos.places;

import lombok.Data;

@Data
public class PlaceImageDTO {
    private int id;
    private int placeId;
    private String filePath;

    // Getters and setters
}
