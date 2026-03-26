package com.resernur.api.repositories;


import com.resernur.api.models.Place;
import com.resernur.api.models.PlaceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Integer> {
}
