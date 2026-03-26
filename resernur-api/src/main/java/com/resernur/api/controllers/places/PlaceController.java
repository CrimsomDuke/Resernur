package com.resernur.api.controllers.places;

import com.resernur.api.dtos.PlaceDTO;
import com.resernur.api.dtos.PlaceImageResponseDTO;
import com.resernur.api.models.Place;
import com.resernur.api.services.PlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    @Value("${media.images.path}")
    private String imagesPath;

    @Autowired
    private PlaceService placeService;

    @GetMapping
    public ResponseEntity<List<Place>> getAllPlaces() {
        return ResponseEntity.ok(placeService.getAllPlaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Place> getPlaceById(@PathVariable int id) {
        Optional<Place> place = placeService.getPlaceById(id);
        return place.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Place> createPlace(@RequestBody PlaceDTO placeDTO) {
        Place place = new Place();
        place.setName(placeDTO.getName());
        place.setDescription(placeDTO.getDescription());
        place.setCapacity(placeDTO.getCapacity());
        // Set userInChargeId logic here
        return ResponseEntity.ok(placeService.savePlace(place));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(@PathVariable int id) {
        placeService.deletePlaceById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{placeId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PlaceImageResponseDTO>> uploadPlaceImages(@PathVariable int placeId, @RequestParam("images") List<MultipartFile> images) throws IOException {
        return ResponseEntity.ok(placeService.uploadImages(placeId, images));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deletePlaceImage(@PathVariable int imageId) throws IOException {
        placeService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{placeId}/images")
    public ResponseEntity<List<PlaceImageResponseDTO>> getImagesForPlace(@PathVariable int placeId) {
        return ResponseEntity.ok(placeService.getImagesForPlace(placeId));
    }
}
