package com.resernur.api.services.places;

import com.resernur.api.dtos.places.PlaceEquipmentCreateDTO;
import com.resernur.api.dtos.places.PlaceEquipmentResponseDTO;
import com.resernur.api.dtos.places.PlaceEquipmentUpdateDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.places.PlaceEquipment;
import com.resernur.api.models.enums.PlaceEquipmentStatus;
import com.resernur.api.repositories.places.PlaceEquimentRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    public StandardResult<PlaceEquipmentResponseDTO> createEquipment(PlaceEquipmentCreateDTO dto) {
        Optional<Place> placeOpt = placeRepository.findById(dto.getPlaceId());
        if (placeOpt.isEmpty()) return new StandardResult<>(false, "Place not found", null);
        Place place = placeOpt.get();

        PlaceEquipment equipment = new PlaceEquipment();
        equipment.setPlace(place);
        equipment.setEquipmentName(dto.getEquipmentName());
        equipment.setQuantity(Math.max(0, dto.getQuantity()));

        // Map status from DTO or default
        PlaceEquipmentStatus status = dto.getStatus() == null ? PlaceEquipmentStatus.AVAILABLE : dto.getStatus();
        equipment.setStatus(status);

        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public StandardResult<PlaceEquipmentResponseDTO> changeState(int equipmentId, String newState) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElse(null);
        if (equipment == null) return new StandardResult<>(false, "Equipment not found", null);
        PlaceEquipmentStatus status = parseStatusOrDefault(newState, equipment.getStatus());
        equipment.setStatus(status);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public StandardResult<PlaceEquipmentResponseDTO> moveEquipment(int equipmentId, int newPlaceId) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElse(null);
        if (equipment == null) return new StandardResult<>(false, "Equipment not found", null);
        Place newPlace = placeRepository.findById(newPlaceId)
                .orElse(null);
        if (newPlace == null) return new StandardResult<>(false, "Destination place not found", null);
        equipment.setPlace(newPlace);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public PagedResponse<PlaceEquipmentResponseDTO> getEquipmentsByPlace(int placeId, SearchQuery query) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<PlaceEquipment> pageResult = placeEquimentRepository.findByPlace_Id(placeId, pageable);
        List<PlaceEquipmentResponseDTO> content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    public StandardResult<PlaceEquipmentResponseDTO> modifyQuantity(int equipmentId, int newQuantity) {
        if (newQuantity < 0) return new StandardResult<>(false, "Quantity cannot be negative", null);
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElse(null);
        if (equipment == null) return new StandardResult<>(false, "Equipment not found", null);
        equipment.setQuantity(newQuantity);
        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public StandardResult<PlaceEquipmentResponseDTO> updateEquipment(int equipmentId, PlaceEquipmentUpdateDTO dto) {
        PlaceEquipment equipment = placeEquimentRepository.findById(equipmentId)
                .orElse(null);
        if (equipment == null) return new StandardResult<>(false, "Equipment not found", null);

        if (dto.getPlaceId() != 0 && dto.getPlaceId() != equipment.getPlace().getId()) {
            Place newPlace = placeRepository.findById(dto.getPlaceId())
                    .orElse(null);
            if (newPlace == null) return new StandardResult<>(false, "Destination place not found", null);
            equipment.setPlace(newPlace);
        }
        if (dto.getEquipmentName() != null) equipment.setEquipmentName(dto.getEquipmentName());
        if (dto.getStatus() != null) equipment.setStatus(dto.getStatus());
        equipment.setQuantity(Math.max(0, dto.getQuantity()));

        PlaceEquipment saved = placeEquimentRepository.save(equipment);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public StandardResult<Void> deleteEquipment(int equipmentId) {
        if (placeEquimentRepository.existsById(equipmentId)) {
            placeEquimentRepository.deleteById(equipmentId);
            return new StandardResult<>(true, "", null);
        }
        return new StandardResult<>(false, "Not found", null);
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
