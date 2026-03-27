package com.resernur.api.models.places;

import com.resernur.api.models.enums.PlaceEquipmentStatus;
import jakarta.persistence.*;

@Entity
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

    // Getters and setters
}
