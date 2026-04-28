package com.resernur.api.unittest.services.places;

import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.places.PlaceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlaceServiceTests {

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PlaceService placeService;

    @Test
    public void searchPlaces_withQuery_returnsPagedResponse() {
        SearchQuery query = new SearchQuery();
        query.searchTerm = "test";
        query.page = 0;
        query.pageSize = 10;

        Place place = new Place();
        place.setId(1);
        place.setName("Test Place");
        place.setDescription("Description");
        place.setCapacity(100);
        place.setStatus(PlaceStatus.AVAILABLE);

        Page<Place> page = new PageImpl<>(List.of(place), PageRequest.of(0, 10), 1);
        when(placeRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(eq("test"), eq("test"), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<PlaceDTO> response = placeService.searchPlaces(query);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getContent().size());
        assertEquals("Test Place", response.getContent().get(0).getName());
    }

    @Test
    public void getPlaceByIdStandard_found_returnsPlaceDTO() {
        Place place = new Place();
        place.setId(1);
        place.setName("Test Place");
        place.setDescription("Description");
        place.setCapacity(100);
        place.setStatus(PlaceStatus.AVAILABLE);

        when(placeRepository.findById(1)).thenReturn(Optional.of(place));

        StandardResult<PlaceDTO> result = placeService.getPlaceByIdStandard(1);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals("Test Place", result.getData().getName());
    }

    @Test
    public void getPlaceByIdStandard_notFound_returnsFailure() {
        when(placeRepository.findById(1)).thenReturn(Optional.empty());

        StandardResult<PlaceDTO> result = placeService.getPlaceByIdStandard(1);

        assertFalse(result.isSuccess());
        assertNull(result.getData());
        assertEquals("Not found", result.getErrorMessage());
    }

    @Test
    public void createPlaceStandard_validInput_createsPlace() {
        PlaceDTO dto = new PlaceDTO();
        dto.setName("New Place");
        dto.setDescription("Description");
        dto.setCapacity(100);

        Place place = new Place();
        place.setId(1);
        place.setName("New Place");
        place.setDescription("Description");
        place.setCapacity(100);
        place.setStatus(PlaceStatus.AVAILABLE);

        when(placeRepository.save(any(Place.class))).thenReturn(place);

        StandardResult<PlaceDTO> result = placeService.createPlaceStandard(dto);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals("New Place", result.getData().getName());
    }

    @Test
    public void updatePlaceStandard_found_updatesPlace() {
        PlaceDTO dto = new PlaceDTO();
        dto.setName("Updated Place");
        dto.setDescription("Updated Description");
        dto.setCapacity(200);

        Place place = new Place();
        place.setId(1);
        place.setName("Old Place");
        place.setDescription("Old Description");
        place.setCapacity(100);
        place.setStatus(PlaceStatus.AVAILABLE);

        when(placeRepository.findById(1)).thenReturn(Optional.of(place));
        when(placeRepository.save(any(Place.class))).thenReturn(place);

        StandardResult<PlaceDTO> result = placeService.updatePlaceStandard(1, dto);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals("Updated Place", result.getData().getName());
    }

    @Test
    public void updatePlaceStandard_notFound_returnsFailure() {
        PlaceDTO dto = new PlaceDTO();
        dto.setName("Updated Place");
        dto.setDescription("Updated Description");
        dto.setCapacity(200);

        when(placeRepository.findById(1)).thenReturn(Optional.empty());

        StandardResult<PlaceDTO> result = placeService.updatePlaceStandard(1, dto);

        assertFalse(result.isSuccess());
        assertNull(result.getData());
        assertEquals("Not found", result.getErrorMessage());
    }

    @Test
    public void deletePlaceStandard_found_deletesPlace() {
        when(placeRepository.existsById(1)).thenReturn(true);

        StandardResult<Void> result = placeService.deletePlaceStandard(1);

        assertTrue(result.isSuccess());
        verify(placeRepository, times(1)).deleteById(1);
    }

    @Test
    public void deletePlaceStandard_notFound_returnsFailure() {
        when(placeRepository.existsById(1)).thenReturn(false);

        StandardResult<Void> result = placeService.deletePlaceStandard(1);

        assertFalse(result.isSuccess());
        verify(placeRepository, never()).deleteById(anyInt());
    }
}
