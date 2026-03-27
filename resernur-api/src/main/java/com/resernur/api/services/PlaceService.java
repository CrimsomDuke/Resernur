package com.resernur.api.services;

import com.resernur.api.dtos.PlaceDTO;
import com.resernur.api.models.Place;
import com.resernur.api.repositories.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PlaceService {
    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;

    // CRUD OPERATIONS
    public List<PlaceDTO> getAllPlaces() {
        return placeRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<PlaceDTO> getPlaceById(int id) {
        return placeRepository.findById(id).map(this::toDTO);
    }

    public PlaceDTO createPlace(PlaceDTO dto) {
        Place place = new Place();
        place.setName(dto.getName());
        place.setDescription(dto.getDescription());
        place.setCapacity(dto.getCapacity());
        place.setStatus(com.resernur.api.models.enums.PlaceStatus.AVAILABLE);
        // Asignar usuario responsable
        userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
        return toDTO(placeRepository.save(place));
    }

    public Optional<PlaceDTO> updatePlace(int id, PlaceDTO dto) {
        return placeRepository.findById(id).map(place -> {
            place.setName(dto.getName());
            place.setDescription(dto.getDescription());
            place.setCapacity(dto.getCapacity());
            // Asignar usuario responsable
            userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
            return toDTO(placeRepository.save(place));
        });
    }

    public boolean deletePlaceById(int id) {
        if (placeRepository.existsById(id)) {
            placeRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // DTO MAPPING
    private PlaceDTO toDTO(Place place) {
        PlaceDTO dto = new PlaceDTO();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setCapacity(place.getCapacity());
        if (place.getUserInCharge() != null) {
            dto.setUserInChargeId(place.getUserInCharge().getId().intValue());
        }
        return dto;
    }
}