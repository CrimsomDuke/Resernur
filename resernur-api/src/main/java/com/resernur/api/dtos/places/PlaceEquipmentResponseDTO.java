package com.resernur.api.dtos.places;

import lombok.Data;

@Data
public class PlaceEquipmentResponseDTO {
    private int id;
    private int placeId;
    private String equipmentName;
    private String status;
    private int quantity;
}
