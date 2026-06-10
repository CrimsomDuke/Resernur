package com.resernur.api.unittest.controllers.places;

import com.resernur.api.controllers.places.PlaceController;
import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.places.PlaceImageResponseDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.services.places.PlaceImageService;
import com.resernur.api.services.places.PlaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PlaceControllerTests {

    @Mock
    private PlaceService placeService;
    @Mock
    private PlaceImageService placeImageService;
    @InjectMocks
    private PlaceController placeController;

    private PlaceDTO placeDTO;

    @BeforeEach
    public void setUp() {
        placeDTO = new PlaceDTO();
        placeDTO.setId(1);
        placeDTO.setName("Aula Magna");
    }

    @Test
    public void getAllPlaces_Success() {
        PagedResponse<PlaceDTO> paged = new PagedResponse<>();
        when(placeService.searchPlaces(any(SearchQuery.class))).thenReturn(paged);
        var response = placeController.getAllPlaces(null, 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void getPlaceById_Success() {
        StandardResult<PlaceDTO> result = new StandardResult<>(true, "", placeDTO);
        when(placeService.getPlaceByIdStandard(1)).thenReturn(result);
        var response = placeController.getPlaceById(1);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void createPlace_Success() {
        StandardResult<PlaceDTO> result = new StandardResult<>(true, "", placeDTO);
        when(placeService.createPlaceStandard(any(PlaceDTO.class))).thenReturn(result);
        var response = placeController.createPlace(placeDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void updatePlace_Success() {
        StandardResult<PlaceDTO> result = new StandardResult<>(true, "", placeDTO);
        when(placeService.updatePlaceStandard(eq(1), any(PlaceDTO.class))).thenReturn(result);
        var response = placeController.updatePlace(1, placeDTO);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void deletePlace_Success() {
        StandardResult<Void> result = new StandardResult<>(true, "", null);
        when(placeService.deletePlaceStandard(1)).thenReturn(result);
        var response = placeController.deletePlace(1);
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    public void uploadPlaceImages_Success() throws IOException {
        int placeId = 1;
        List<MultipartFile> images = Collections.emptyList();
        PagedResponse<PlaceImageResponseDTO> paged = new PagedResponse<>();
        when(placeImageService.uploadImages(eq(placeId), anyList())).thenReturn(paged);
        var response = placeController.uploadPlaceImages(placeId, images);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void deletePlaceImage_Success() throws IOException {
        int imageId = 1;
        StandardResult<Void> result = new StandardResult<>(true, "", null);
        when(placeImageService.deleteImage(imageId)).thenReturn(result);
        var response = placeController.deletePlaceImage(imageId);
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    public void getImagesForPlace_Success() {
        int placeId = 1;
        int page = 0;
        int pageSize = 10;
        PagedResponse<PlaceImageResponseDTO> paged = new PagedResponse<>();
        when(placeImageService.getImagesForPlace(eq(placeId), any(SearchQuery.class))).thenReturn(paged);
        var response = placeController.getImagesForPlace(placeId, page, pageSize);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void changeStatus_Success() {
        int placeId = 1;
        var status = PlaceStatus.AVAILABLE;
        PlaceDTO dto = new PlaceDTO();
        dto.setId(placeId);
        dto.setName("Aula Magna");
        StandardResult<PlaceDTO> result = new StandardResult<>(true, "", dto);
        when(placeService.changePlaceStatus(eq(placeId), eq(status))).thenReturn(result);
        var response = placeController.changeStatus(placeId, status);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(placeId, response.getBody().getData().getId());
    }
}
