package com.resernur.api.models;

import com.resernur.api.models.users.User;
import jakarta.persistence.*;

@Entity
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(length = 100)
    private String name;

    private String description;

    @Column(nullable = false)
    private int capacity = 0;

    @ManyToOne(optional = false)
    @JoinColumn(name = "userInChargeId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_place_user"))
    private User userInCharge;

    // Getters and setters
}
