package com.resernur.api.unittest.controllers.places;

import com.resernur.api.controllers.places.PlaceEquipmentController;
import com.resernur.api.dtos.places.*;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.models.enums.PlaceEquipmentStatus;
import com.resernur.api.services.places.PlaceEquipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PlaceEquipmentControllerTests {
    @Mock
    private PlaceEquipmentService equipmentService;
    @InjectMocks
    private PlaceEquipmentController controller;

    private PlaceEquipmentResponseDTO equipmentDTO;

    @BeforeEach
    public void setUp() {
        equipmentDTO = new PlaceEquipmentResponseDTO();
        equipmentDTO.setId(1);
        equipmentDTO.setPlaceId(2);
        equipmentDTO.setEquipmentName("Proyector");
        equipmentDTO.setQuantity(3);
    }

    @Test
    public void createEquipment_Success() {
        PlaceEquipmentCreateDTO createDTO = new PlaceEquipmentCreateDTO();
        createDTO.setPlaceId(2);
        StandardResult<PlaceEquipmentResponseDTO> result = new StandardResult<>(true, "", equipmentDTO);
        when(equipmentService.createEquipment(any(PlaceEquipmentCreateDTO.class))).thenReturn(result);
        var response = controller.createEquipment(2, createDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void updateEquipment_Success() {
        PlaceEquipmentUpdateDTO updateDTO = new PlaceEquipmentUpdateDTO();
        StandardResult<PlaceEquipmentResponseDTO> result = new StandardResult<>(true, "", equipmentDTO);
        when(equipmentService.updateEquipment(eq(1), any(PlaceEquipmentUpdateDTO.class))).thenReturn(result);
        var response = controller.updateEquipment(1, updateDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void changeState_Success() {
        ModifyStatusPlaceEquipmentDTO statusDTO = new ModifyStatusPlaceEquipmentDTO();
        statusDTO.setStatus(PlaceEquipmentStatus.AVAILABLE);
        StandardResult<PlaceEquipmentResponseDTO> result = new StandardResult<>(true, "", equipmentDTO);
        when(equipmentService.changeState(eq(1), anyString())).thenReturn(result);
        var response = controller.changeState(1, statusDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    public void moveEquipment_Success() {
        MovePlaceEquipmentDTO moveDTO = new MovePlaceEquipmentDTO();
        moveDTO.setNewPlaceId(3);
        StandardResult<PlaceEquipmentResponseDTO> result = new StandardResult<>(true, "", equipmentDTO);
        when(equipmentService.moveEquipment(eq(1), eq(3))).thenReturn(result);
        var response = controller.moveEquipment(1, moveDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    public void getEquipmentsByPlace_Success() {
        PagedResponse<PlaceEquipmentResponseDTO> paged = new PagedResponse<>();
        when(equipmentService.getEquipmentsByPlace(eq(2), any(SearchQuery.class))).thenReturn(paged);
        var response = controller.getEquipmentsByPlace(2, 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void modifyQuantity_Success() {
        ModifyQuantityPlaceEquipmentDTO qtyDTO = new ModifyQuantityPlaceEquipmentDTO();
        qtyDTO.setQuantity(5);
        StandardResult<PlaceEquipmentResponseDTO> result = new StandardResult<>(true, "", equipmentDTO);
        when(equipmentService.modifyQuantity(eq(1), eq(5))).thenReturn(result);
        var response = controller.modifyQuantity(1, qtyDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    public void deleteEquipment_Success() {
        StandardResult<Void> result = new StandardResult<>(true, "", null);
        when(equipmentService.deleteEquipment(1)).thenReturn(result);
        var response = controller.deleteEquipment(1);
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }
}
