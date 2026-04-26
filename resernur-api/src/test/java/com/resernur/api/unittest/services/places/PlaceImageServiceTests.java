package com.resernur.api.unittest.services.places;

import com.resernur.api.dtos.places.PlaceImageResponseDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.places.PlaceImage;
import com.resernur.api.repositories.places.PlaceImageRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.places.PlaceImageService;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlaceImageServiceTests {
    @Mock
    private PlaceRepository placeRepository;
    @Mock
    private PlaceImageRepository placeImageRepository;
    @InjectMocks
    private PlaceImageService placeImageService;

    private Place place;
    private PlaceImage image;

    @BeforeEach
    public void setup() {
        place = new Place();
        place.setId(1);
        place.setName("Aula Magna");
        image = new PlaceImage();
        image.setId(10);
        image.setPlace(place);
        image.setFilePath("places/1/test.jpg");
        // Set paths to avoid NPE
        ReflectionTestUtils.setField(placeImageService, "imagesPath", System.getProperty("java.io.tmpdir"));
        ReflectionTestUtils.setField(placeImageService, "publicUrlBase", "http://localhost");
        ReflectionTestUtils.setField(placeImageService, "mediaEndpoint", "media");
    }

    @Test
    public void uploadImages_Success() throws IOException {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getContentType()).thenReturn("image/png");
        when(mockFile.getOriginalFilename()).thenReturn("test.jpg");
        doNothing().when(mockFile).transferTo(any(java.io.File.class));
        when(placeRepository.findById(eq(place.getId()))).thenReturn(Optional.of(place));
        when(placeImageRepository.save(any(PlaceImage.class))).thenAnswer(inv -> {
            PlaceImage pi = inv.getArgument(0);
            pi.setId(10);
            return pi;
        });
        List<MultipartFile> files = List.of(mockFile);
        PagedResponse<PlaceImageResponseDTO> result = placeImageService.uploadImages(place.getId(), files);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        assertNotNull(result.getContent().get(0).getUrl());
        verify(placeRepository, times(1)).findById(eq(place.getId()));
        verify(placeImageRepository, times(1)).save(any(PlaceImage.class));
    }

    @Test
    public void deleteImage_Success() throws IOException {
        when(placeImageRepository.findById(eq(image.getId()))).thenReturn(Optional.of(image));
        doNothing().when(placeImageRepository).deleteById(eq(image.getId()));
        // No exception thrown for file deletion
        StandardResult<Void> result = placeImageService.deleteImage(image.getId());
        assertTrue(result.isSuccess());
        verify(placeImageRepository, times(1)).findById(eq(image.getId()));
        verify(placeImageRepository, times(1)).deleteById(eq(image.getId()));
    }

    @Test
    public void getImagesForPlace_Success() {
        SearchQuery query = new SearchQuery("", 0, 10);
        Pageable pageable = PageRequest.of(0, 10);
        Page<PlaceImage> page = new PageImpl<>(List.of(image), pageable, 1);
        when(placeImageRepository.findByPlace_Id(eq(place.getId()), any(Pageable.class))).thenReturn(page);
        PagedResponse<PlaceImageResponseDTO> result = placeImageService.getImagesForPlace(place.getId(), query);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        assertNotNull(result.getContent().get(0).getUrl());
        verify(placeImageRepository, times(1)).findByPlace_Id(eq(place.getId()), any(Pageable.class));
    }
}
