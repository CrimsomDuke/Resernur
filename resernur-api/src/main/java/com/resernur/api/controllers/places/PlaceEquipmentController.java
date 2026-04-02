package com.resernur.api.controllers.places;

import com.resernur.api.dtos.places.*;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.services.places.PlaceEquipmentService;
import com.resernur.api.utils.aspect.RequiresAnyRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PlaceEquipmentController {

    @Autowired
    private PlaceEquipmentService equipmentService;

    // Create equipment for a place
    @PostMapping("/places/{placeId}/equipment")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceEquipmentResponseDTO>> createEquipment(@PathVariable int placeId, @RequestBody PlaceEquipmentCreateDTO dto) {
        dto.setPlaceId(placeId);
        StandardResult<PlaceEquipmentResponseDTO> res = equipmentService.createEquipment(dto);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // Update equipment fully
    @PutMapping("/equipment/{equipmentId}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceEquipmentResponseDTO>> updateEquipment(@PathVariable int equipmentId, @RequestBody PlaceEquipmentUpdateDTO dto) {
        StandardResult<PlaceEquipmentResponseDTO> res = equipmentService.updateEquipment(equipmentId, dto);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Change state
    @PatchMapping("/equipment/{equipmentId}/state")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceEquipmentResponseDTO>> changeState(@PathVariable int equipmentId, @RequestBody ModifyStatusPlaceEquipmentDTO body) {
        String state = body.getStatus() != null ? body.getStatus().name() : null;
        StandardResult<PlaceEquipmentResponseDTO> res = equipmentService.changeState(equipmentId, state);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Move equipment
    @PostMapping("/equipment/{equipmentId}/move")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceEquipmentResponseDTO>> moveEquipment(@PathVariable int equipmentId, @RequestBody MovePlaceEquipmentDTO body) {
        Integer newPlaceId = body.getNewPlaceId();
        if (newPlaceId == null || newPlaceId == 0) {
            StandardResult<PlaceEquipmentResponseDTO> bad = new StandardResult<>(false, "newPlaceId is required", null);
            return ResponseEntity.badRequest().body(bad);
        }
        StandardResult<PlaceEquipmentResponseDTO> res = equipmentService.moveEquipment(equipmentId, newPlaceId);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Get all equipments for a place (paged)
    @GetMapping("/places/{placeId}/equipment")
    public ResponseEntity<PagedResponse<PlaceEquipmentResponseDTO>> getEquipmentsByPlace(@PathVariable int placeId,
                                                                                         @RequestParam(value = "page", defaultValue = "0") int page,
                                                                                         @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        SearchQuery q = new SearchQuery(null, page, pageSize);
        return ResponseEntity.ok(equipmentService.getEquipmentsByPlace(placeId, q));
    }

    // Modify quantity
    @PatchMapping("/equipment/{equipmentId}/quantity")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<PlaceEquipmentResponseDTO>> modifyQuantity(@PathVariable int equipmentId, @RequestBody ModifyQuantityPlaceEquipmentDTO body) {
        Integer qty = body.getQuantity();
        if (qty == null) {
            StandardResult<PlaceEquipmentResponseDTO> bad = new StandardResult<>(false, "quantity is required", null);
            return ResponseEntity.badRequest().body(bad);
        }
        StandardResult<PlaceEquipmentResponseDTO> res = equipmentService.modifyQuantity(equipmentId, qty);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/equipment/{equipmentId}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR", "ENCARGADO"})
    public ResponseEntity<StandardResult<Void>> deleteEquipment(@PathVariable int equipmentId) {
        StandardResult<Void> res = equipmentService.deleteEquipment(equipmentId);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.noContent().build();
    }
}
