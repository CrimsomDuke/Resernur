package com.resernur.api.models;

import jakarta.persistence.*;

@Entity
public class PlaceImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String filePath;

    @ManyToOne(optional = false)
    @JoinColumn(name = "placeId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_placeImage_place"))
    private Place place;

    // Getters and setters
}
