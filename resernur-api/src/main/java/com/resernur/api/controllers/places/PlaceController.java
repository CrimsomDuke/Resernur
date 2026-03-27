package com.resernur.api.controllers.places;

import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.places.PlaceImageResponseDTO;
import com.resernur.api.services.places.PlaceImageService;
import com.resernur.api.services.places.PlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    @Autowired
    private PlaceService placeService;

    @Autowired
    private PlaceImageService placeImageService;

    @GetMapping
    public ResponseEntity<List<PlaceDTO>> getAllPlaces() {
        return ResponseEntity.ok(placeService.getAllPlaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceDTO> getPlaceById(@PathVariable int id) {
        return placeService.getPlaceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PlaceDTO> createPlace(@RequestBody PlaceDTO placeDTO) {
        return ResponseEntity.ok(placeService.createPlace(placeDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceDTO> updatePlace(@PathVariable int id, @RequestBody PlaceDTO placeDTO) {
        return placeService.updatePlace(id, placeDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(@PathVariable int id) {
        if (placeService.deletePlaceById(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping(value = "/{placeId}/images", consumes = "multipart/form-data")
    public ResponseEntity<List<PlaceImageResponseDTO>> uploadPlaceImages(@PathVariable int placeId, @RequestParam("images") List<MultipartFile> images) throws IOException {
        return ResponseEntity.ok(placeImageService.uploadImages(placeId, images));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deletePlaceImage(@PathVariable int imageId) throws IOException {
        if (placeImageService.deleteImage(imageId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{placeId}/images")
    public ResponseEntity<List<PlaceImageResponseDTO>> getImagesForPlace(@PathVariable int placeId) {
        return ResponseEntity.ok(placeImageService.getImagesForPlace(placeId));
    }
}
