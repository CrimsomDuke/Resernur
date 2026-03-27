package com.resernur.api.dtos.places;

import com.resernur.api.models.enums.PlaceEquipmentStatus;
import lombok.Data;

@Data
public class PlaceEquipmentUpdateDTO {
    private int placeId; // opcional: si permites reasignar el equipo
    private String equipmentName;
    private PlaceEquipmentStatus status;
    private int quantity;
}
