package com.resernur.api.repositories.places;

import com.resernur.api.models.places.PlaceEquipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceEquimentRepository extends JpaRepository<PlaceEquipment, Integer> {
    List<PlaceEquipment> findByPlace_Id(int placeId);
}
