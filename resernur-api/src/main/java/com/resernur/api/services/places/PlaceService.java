package com.resernur.api.services.places;

import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.NotificationService;
import com.resernur.api.services.bookings.BookingRequestService;
import com.resernur.api.utils.components.places.PlaceValidationComponent;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PlaceService {
    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PlaceValidationComponent placeValidationComponent;

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

        Optional<User> userInChargeOpt = Optional.empty();

        // Asignar usuario responsable
        if (dto.getUserInChargeId() != 0) {
            userInChargeOpt = userRepository.findById((long) dto.getUserInChargeId());
            userInChargeOpt.ifPresent(place::setUserInCharge);
        }

        placeValidationComponent.validatePlaceUpdateData(dto, placeRepository, userInChargeOpt);

        Place saved = placeRepository.save(place);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Update
    public StandardResult<PlaceDTO> updatePlaceStandard(int id, PlaceDTO dto) {
        Optional<Place> updated = placeRepository.findById(id).map(place -> {
            place.setName(dto.getName());
            place.setDescription(dto.getDescription());
            place.setCapacity(dto.getCapacity());

            Optional<User> userInChargeOpt = Optional.empty();

            if (dto.getUserInChargeId() != 0) {
                userInChargeOpt = userRepository.findById((long) dto.getUserInChargeId());
                userInChargeOpt.ifPresent(place::setUserInCharge);
            }

            placeValidationComponent.validatePlaceUpdateData(dto, placeRepository, userInChargeOpt);

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

    @Transactional
    public StandardResult<PlaceDTO> changePlaceStatus(int id, PlaceStatus newStatus) {
        Optional<Place> place = placeRepository.findById(id);
        if(place.isEmpty()) return new StandardResult<>(false, "Not found", null);

        Place p = place.get();
        p.setStatus(newStatus);

        if(p.getStatus() == PlaceStatus.UNDER_MAINTENANCE){
            cancelRequestsForAPlace(id);
            cancelPendingRequestsForAPlace(id, "Debido a razones de mantenimiento, tu solicitud de reserva para el lugar " + p.getName() + " ha sido rechazada.");
        }

        Place saved = placeRepository.save(p);

        return new StandardResult<>(true, "", toDTO(saved));
    }

    public void cancelRequestsForAPlace(int placeId){
        var activeBookings = bookingRepository.findCompletedByPlaceIdAndEndTimeAfter(placeId, LocalDateTime.now());
        for(var booking : activeBookings){
            booking.setStatus(com.resernur.api.models.enums.BookingStatus.CANCELLED);
            notificationService.createNotification(booking.getBookingRequest().getUser().getId(), "Debido a razones de mantenimiento, tu reserva para el lugar " + booking.getBookingRequest().getPlace().getName() + " ha sido cancelada.");
            notificationService.createNotification(booking.
                    getBookingRequest().getUser().getId(), "Debido a razones de mantenimiento, tu reserva para el lugar " + booking.getBookingRequest().getPlace().getName() + " ha sido cancelada.");

            bookingRepository.save(booking);
        }
    }

    public void cancelPendingRequestsForAPlace(int placeId, String message){
        var pendingRequests = bookingRequestRepository.findActiveRequestsByPlaceId(placeId);
        for(var request : pendingRequests){
            request.setStatus(com.resernur.api.models.enums.BookingRequestStatus.REJECTED);
            request.setChangesRequestedReason(message);
            bookingRequestRepository.save(request);
            notificationService.createNotification(request.getUser().getId(), message);
        }
    }


    // DTO MAPPING
    private PlaceDTO toDTO(Place place) {
        PlaceDTO dto = new PlaceDTO();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setCapacity(place.getCapacity());
        dto.setUserInChargeId(place.getUserInCharge() != null ? place.getUserInCharge().getId().intValue() : 0);
        dto.setStatus(place.getStatus());
        return dto;
    }
}