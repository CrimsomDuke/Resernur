package com.resernur.api.repositories.places;


import com.resernur.api.models.places.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Integer> {
    // Resulta que el fucking springboot lee bastante bien estos nombres
    // de metodos y aplica la logica de busqueda sin necesidad de escribir queries manuales
    Page<Place> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description, Pageable pageable);

    @Query(
            value = "SELECT DISTINCT p.* FROM Place p JOIN Booking b on p.id = b.place_id WHERE b.end_time < CURRENT_TIMESTAMP",
            nativeQuery = true
    )
    List<Place> findAllPlacesWithPastBookings();
}
