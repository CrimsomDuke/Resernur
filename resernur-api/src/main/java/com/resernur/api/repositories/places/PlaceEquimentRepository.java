package com.resernur.api.repositories.places;

import com.resernur.api.models.places.PlaceEquipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceEquimentRepository extends JpaRepository<PlaceEquipment, Integer> {
    List<PlaceEquipment> findByPlace_Id(int placeId);

    // Paginated search by equipment name
    Page<PlaceEquipment> findByEquipmentNameContainingIgnoreCase(String equipmentName, Pageable pageable);

    // Paginated find by place id
    Page<PlaceEquipment> findByPlace_Id(int placeId, Pageable pageable);
}
