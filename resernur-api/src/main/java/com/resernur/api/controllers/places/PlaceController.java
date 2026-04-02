package com.resernur.api.controllers.places;

import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.dtos.places.PlaceImageResponseDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.services.places.PlaceImageService;
import com.resernur.api.services.places.PlaceService;
import com.resernur.api.utils.aspect.RequiresAnyRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<PagedResponse<PlaceDTO>> getAllPlaces(@RequestParam(value = "search", required = false) String search,
                                                                @RequestParam(value = "page", defaultValue = "0") int page,
                                                                @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        SearchQuery query = new SearchQuery(search, page, pageSize);
        return ResponseEntity.ok(placeService.searchPlaces(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResult<PlaceDTO>> getPlaceById(@PathVariable int id) {
        StandardResult<PlaceDTO> res = placeService.getPlaceByIdStandard(id);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    @RequiresAnyRole(roles = {"ADMINISTRADOR"})
    public ResponseEntity<StandardResult<PlaceDTO>> createPlace(@RequestBody PlaceDTO placeDTO) {
        StandardResult<PlaceDTO> res = placeService.createPlaceStandard(placeDTO);
        if (!res.isSuccess()) return ResponseEntity.badRequest().body(res);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PutMapping("/{id}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceDTO>> updatePlace(@PathVariable int id, @RequestBody PlaceDTO placeDTO) {
        StandardResult<PlaceDTO> res = placeService.updatePlaceStandard(id, placeDTO);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.ok(res);
    }

    @RequiresAnyRole(roles = {"ADMINISTRADOR"})
    @DeleteMapping("/{id}")
    public ResponseEntity<StandardResult<Void>> deletePlace(@PathVariable int id) {
        StandardResult<Void> res = placeService.deletePlaceStandard(id);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.noContent().build();
    }

    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    @PostMapping(value = "/{placeId}/images", consumes = "multipart/form-data")
    public ResponseEntity<PagedResponse<PlaceImageResponseDTO>> uploadPlaceImages(@PathVariable int placeId, @RequestParam("images") List<MultipartFile> images) throws IOException {
        return ResponseEntity.ok(placeImageService.uploadImages(placeId, images));
    }

    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<StandardResult<Void>> deletePlaceImage(@PathVariable int imageId) throws IOException {
        StandardResult<Void> res = placeImageService.deleteImage(imageId);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{placeId}/images")
    public ResponseEntity<PagedResponse<PlaceImageResponseDTO>> getImagesForPlace(@PathVariable int placeId,
                                                                                 @RequestParam(value = "page", defaultValue = "0") int page,
                                                                                 @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        SearchQuery q = new SearchQuery(null, page, pageSize);
        return ResponseEntity.ok(placeImageService.getImagesForPlace(placeId, q));
    }
}
