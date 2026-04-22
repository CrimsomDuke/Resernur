package com.resernur.api.unittest.services.places;

import com.resernur.api.dtos.places.PlaceEquipmentCreateDTO;
import com.resernur.api.dtos.places.PlaceEquipmentResponseDTO;
import com.resernur.api.dtos.places.PlaceEquipmentUpdateDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.PlaceEquipmentStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.places.PlaceEquipment;
import com.resernur.api.repositories.places.PlaceEquimentRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.places.PlaceEquipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlaceEquipmentServiceTests {
    @Mock
    private PlaceEquimentRepository placeEquimentRepository;
    @Mock
    private PlaceRepository placeRepository;
    @InjectMocks
    private PlaceEquipmentService placeEquipmentService;

    private Place place;
    private PlaceEquipment equipment;

    @BeforeEach
    public void setup() {
        place = new Place();
        place.setId(1);
        place.setName("Aula Magna");
        equipment = new PlaceEquipment();
        equipment.setId(10);
        equipment.setPlace(place);
        equipment.setEquipmentName("Proyector");
        equipment.setQuantity(2);
        equipment.setStatus(PlaceEquipmentStatus.AVAILABLE);
    }

    @Test
    public void createEquipment_Success() {
        PlaceEquipmentCreateDTO dto = new PlaceEquipmentCreateDTO();
        dto.setPlaceId(place.getId());
        dto.setEquipmentName("Proyector");
        dto.setQuantity(2);
        dto.setStatus(PlaceEquipmentStatus.AVAILABLE);
        when(placeRepository.findById(eq(place.getId()))).thenReturn(Optional.of(place));
        when(placeEquimentRepository.save(any(PlaceEquipment.class))).thenReturn(equipment);

        StandardResult<PlaceEquipmentResponseDTO> result = placeEquipmentService.createEquipment(dto);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(equipment.getEquipmentName(), result.getData().getEquipmentName());
        verify(placeRepository, times(1)).findById(eq(place.getId()));
        verify(placeEquimentRepository, times(1)).save(any(PlaceEquipment.class));
    }

    @Test
    public void changeState_Success() {
        when(placeEquimentRepository.findById(eq(equipment.getId()))).thenReturn(Optional.of(equipment));
        when(placeEquimentRepository.save(any(PlaceEquipment.class))).thenReturn(equipment);

        StandardResult<PlaceEquipmentResponseDTO> result = placeEquipmentService.changeState(equipment.getId(), "UNAVAILABLE");

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(equipment.getId(), result.getData().getId());
        verify(placeEquimentRepository, times(1)).findById(eq(equipment.getId()));
        verify(placeEquimentRepository, times(1)).save(any(PlaceEquipment.class));
    }

    @Test
    public void moveEquipment_Success() {
        Place newPlace = new Place();
        newPlace.setId(2);
        newPlace.setName("Laboratorio");
        when(placeEquimentRepository.findById(eq(equipment.getId()))).thenReturn(Optional.of(equipment));
        when(placeRepository.findById(eq(newPlace.getId()))).thenReturn(Optional.of(newPlace));
        when(placeEquimentRepository.save(any(PlaceEquipment.class))).thenReturn(equipment);

        StandardResult<PlaceEquipmentResponseDTO> result = placeEquipmentService.moveEquipment(equipment.getId(), newPlace.getId());

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(equipment.getId(), result.getData().getId());
        verify(placeEquimentRepository, times(1)).findById(eq(equipment.getId()));
        verify(placeRepository, times(1)).findById(eq(newPlace.getId()));
        verify(placeEquimentRepository, times(1)).save(any(PlaceEquipment.class));
    }

    @Test
    public void getEquipmentsByPlace_Success() {
        SearchQuery query = new SearchQuery("", 0, 10);
        Pageable pageable = PageRequest.of(0, 10);
        Page<PlaceEquipment> page = new PageImpl<>(List.of(equipment), pageable, 1);
        when(placeEquimentRepository.findByPlace_Id(eq(place.getId()), any(Pageable.class))).thenReturn(page);

        PagedResponse<PlaceEquipmentResponseDTO> result = placeEquipmentService.getEquipmentsByPlace(place.getId(), query);

        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        verify(placeEquimentRepository, times(1)).findByPlace_Id(eq(place.getId()), any(Pageable.class));
    }

    @Test
    public void modifyQuantity_Success() {
        when(placeEquimentRepository.findById(eq(equipment.getId()))).thenReturn(Optional.of(equipment));
        when(placeEquimentRepository.save(any(PlaceEquipment.class))).thenReturn(equipment);

        StandardResult<PlaceEquipmentResponseDTO> result = placeEquipmentService.modifyQuantity(equipment.getId(), 5);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(5, result.getData().getQuantity());
        verify(placeEquimentRepository, times(1)).findById(eq(equipment.getId()));
        verify(placeEquimentRepository, times(1)).save(any(PlaceEquipment.class));
    }

    @Test
    public void updateEquipment_Success() {
        PlaceEquipmentUpdateDTO dto = new PlaceEquipmentUpdateDTO();
        dto.setPlaceId(place.getId());
        dto.setEquipmentName("Pantalla");
        dto.setStatus(PlaceEquipmentStatus.OUT_OF_ORDER);
        dto.setQuantity(3);
        when(placeEquimentRepository.findById(eq(equipment.getId()))).thenReturn(Optional.of(equipment));
        when(placeEquimentRepository.save(any(PlaceEquipment.class))).thenReturn(equipment);

        StandardResult<PlaceEquipmentResponseDTO> result = placeEquipmentService.updateEquipment(equipment.getId(), dto);

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals("Pantalla", result.getData().getEquipmentName());
        verify(placeEquimentRepository, times(1)).findById(eq(equipment.getId()));
        verify(placeEquimentRepository, times(1)).save(any(PlaceEquipment.class));
    }

    @Test
    public void deleteEquipment_Success() {
        when(placeEquimentRepository.existsById(eq(equipment.getId()))).thenReturn(true);
        doNothing().when(placeEquimentRepository).deleteById(eq(equipment.getId()));

        StandardResult<Void> result = placeEquipmentService.deleteEquipment(equipment.getId());

        assertTrue(result.isSuccess());
        verify(placeEquimentRepository, times(1)).existsById(eq(equipment.getId()));
        verify(placeEquimentRepository, times(1)).deleteById(eq(equipment.getId()));
    }
}
