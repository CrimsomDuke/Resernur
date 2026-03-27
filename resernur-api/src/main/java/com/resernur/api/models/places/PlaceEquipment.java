package com.resernur.api.models.places;

import com.resernur.api.models.enums.PlaceEquipmentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class PlaceEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "placeId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_placeEquipment_place"))
    private Place place;

    private String equipmentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceEquipmentStatus status = PlaceEquipmentStatus.AVAILABLE;

    @Column(nullable = false)
    private int quantity = 1;

}
