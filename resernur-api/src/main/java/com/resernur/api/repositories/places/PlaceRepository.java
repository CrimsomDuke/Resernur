package com.resernur.api.repositories.places;


import com.resernur.api.models.places.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Integer> {
    // Resulta que el fucking springboot lee bastante bien estos nombres
    // de metodos y aplica la logica de busqueda sin necesidad de escribir queries manuales
    Page<Place> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description, Pageable pageable);
}
