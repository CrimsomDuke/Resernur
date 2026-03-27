package com.resernur.api.dtos.places;

import com.resernur.api.models.enums.PlaceEquipmentStatus;
import lombok.Data;

@Data
public class PlaceEquipmentCreateDTO {
    private int placeId;
    private String equipmentName;
    private PlaceEquipmentStatus status;
    private int quantity = 1;
}
