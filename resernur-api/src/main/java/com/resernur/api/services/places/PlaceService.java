package com.resernur.api.services.places;

import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    public PagedResponse<PlaceDTO> searchPlaces(SearchQuery query) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        String term = query == null ? "" : (query.searchTerm == null ? "" : query.searchTerm.trim());

        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Place> result = placeRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(term, term, pageable);

        List<PlaceDTO> content = result.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast(), true, "");
    }

    // Single retrieval
    public StandardResult<PlaceDTO> getPlaceByIdStandard(int id) {
        Optional<Place> opt = placeRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    // Create
    public StandardResult<PlaceDTO> createPlaceStandard(PlaceDTO dto) {
        Place place = new Place();
        place.setName(dto.getName());
        place.setDescription(dto.getDescription());
        place.setCapacity(dto.getCapacity());
        place.setStatus(PlaceStatus.AVAILABLE);
        // Asignar usuario responsable
        if (dto.getUserInChargeId() != 0) {
            userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
        }
        Place saved = placeRepository.save(place);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Update
    public StandardResult<PlaceDTO> updatePlaceStandard(int id, PlaceDTO dto) {
        Optional<Place> updated = placeRepository.findById(id).map(place -> {
            place.setName(dto.getName());
            place.setDescription(dto.getDescription());
            place.setCapacity(dto.getCapacity());
            if (dto.getUserInChargeId() != 0) {
                userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
            }
            return placeRepository.save(place);
        });
        if (updated.isPresent()) return new StandardResult<>(true, "", toDTO(updated.get()));
        return new StandardResult<>(false, "Not found", null);
    }

    // Delete
    public StandardResult<Void> deletePlaceStandard(int id) {
        if (placeRepository.existsById(id)) {
            placeRepository.deleteById(id);
            return new StandardResult<>(true, "", null);
        }
        return new StandardResult<>(false, "Not found", null);
    }

    // DTO MAPPING
    private PlaceDTO toDTO(Place place) {
        PlaceDTO dto = new PlaceDTO();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setCapacity(place.getCapacity());
        dto.setUserInChargeId(place.getUserInCharge() != null ? place.getUserInCharge().getId().intValue() : 0);
        return dto;
    }
}