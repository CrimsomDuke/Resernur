package com.resernur.api.services.places;

import com.resernur.api.dtos.places.PlaceEquipmentCreateDTO;
import com.resernur.api.dtos.places.PlaceEquipmentResponseDTO;
import com.resernur.api.dtos.places.PlaceEquipmentUpdateDTO;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.places.PlaceEquipment;
import com.resernur.api.models.enums.PlaceEquipmentStatus;
import com.resernur.api.repositories.places.PlaceEquimentRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PlaceEquipmentService {

    @Autowired
    private PlaceEquimentRepository placeEquimentRepository;

    @Autowired
    private PlaceRepository placeRepository;

    public PlaceEquipmentResponseDTO createEquipment(PlaceEquipmentCreateDTO dto) {
        Optional<Place> placeOpt = placeRepository.findById(dto.getPlaceId());
        if (placeOpt.isEmpty()) throw new IllegalArgumentException("Place not found");
        Place place = placeOpt.get();

        PlaceEquipment equipment = new PlaceEquipment();
        equipment.setPlace(place);
        equipment.setEquipmentName(dto.getEquipmentName());
        equipment.setQuantity(Math.max(0, dto.getQuantity()));

        // Map status string to enum if provided
        PlaceEquipmentStatus status = parseStatusOrDefault(dto.getStatus().toString(), PlaceEquipmentStatus.AVAILABLE);
        equipment.setStatus(status);

        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return toDTO(saved);
    }

    public PlaceEquipmentResponseDTO changeState(int equipmentId, String newState) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));
        PlaceEquipmentStatus status = parseStatusOrDefault(newState, equipment.getStatus());
        equipment.setStatus(status);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return toDTO(saved);
    }

    public PlaceEquipmentResponseDTO moveEquipment(int equipmentId, int newPlaceId) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));
        Place newPlace = placeRepository.findById(newPlaceId)
                .orElseThrow(() -> new IllegalArgumentException("Destination place not found"));
        equipment.setPlace(newPlace);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return toDTO(saved);
    }

    public List<PlaceEquipmentResponseDTO> getEquipmentsByPlace(int placeId) {
        List<PlaceEquipment> list = placeEquimentRepository.findByPlace_Id(placeId);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PlaceEquipmentResponseDTO modifyQuantity(int equipmentId, int newQuantity) {
        if (newQuantity < 0) throw new IllegalArgumentException("Quantity cannot be negative");
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));
        equipment.setQuantity(newQuantity);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return toDTO(saved);
    }

    public PlaceEquipmentResponseDTO updateEquipment(int equipmentId, PlaceEquipmentUpdateDTO dto) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));

        if (dto.getPlaceId() != 0 && dto.getPlaceId() != equipment.getPlace().getId()) {
            Place newPlace = placeRepository.findById(dto.getPlaceId())
                    .orElseThrow(() -> new IllegalArgumentException("Destination place not found"));
            equipment.setPlace(newPlace);
        }
        if (dto.getEquipmentName() != null) equipment.setEquipmentName(dto.getEquipmentName());
        if (dto.getStatus() != null) equipment.setStatus(parseStatusOrDefault(dto.getStatus().toString(), equipment.getStatus()));
        equipment.setQuantity(Math.max(0, dto.getQuantity()));

        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return toDTO(saved);
    }

    public boolean deleteEquipment(int equipmentId) {
        if (placeEquimentRepository.existsById(equipmentId)) {
            placeEquimentRepository.deleteById(equipmentId);
            return true;
        }
        return false;
    }

    private PlaceEquipmentResponseDTO toDTO(PlaceEquipment equipment) {
        PlaceEquipmentResponseDTO dto = new PlaceEquipmentResponseDTO();
        dto.setId(equipment.getId());
        dto.setPlaceId(equipment.getPlace() != null ? equipment.getPlace().getId() : 0);
        dto.setEquipmentName(equipment.getEquipmentName());
        dto.setStatus(equipment.getStatus() != null ? equipment.getStatus().name() : null);
        dto.setQuantity(equipment.getQuantity());
        return dto;
    }

    private PlaceEquipmentStatus parseStatusOrDefault(String raw, PlaceEquipmentStatus fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return PlaceEquipmentStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }
}
