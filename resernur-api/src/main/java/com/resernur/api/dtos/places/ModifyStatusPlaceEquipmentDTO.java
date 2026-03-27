package com.resernur.api.dtos.places;

import com.resernur.api.models.enums.PlaceEquipmentStatus;
import lombok.Data;

@Data
public class ModifyStatusPlaceEquipmentDTO {
    private PlaceEquipmentStatus status;
}
