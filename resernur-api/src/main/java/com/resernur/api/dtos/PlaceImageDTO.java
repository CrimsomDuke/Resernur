package com.resernur.api.dtos;

import lombok.Data;

@Data
public class PlaceImageDTO {
    private int id;
    private int placeId;
    private String filePath;

    // Getters and setters
}
