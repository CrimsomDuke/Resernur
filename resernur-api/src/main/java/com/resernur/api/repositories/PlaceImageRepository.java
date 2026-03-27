package com.resernur.api.repositories;
import com.resernur.api.models.PlaceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceImageRepository extends JpaRepository<PlaceImage, Integer> {
    // Permite obtener todas las imágenes asociadas a un place por su id
    List<PlaceImage> findByPlace_Id(int placeId);
}
