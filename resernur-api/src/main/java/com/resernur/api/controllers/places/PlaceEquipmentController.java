package com.resernur.api.controllers.places;

import com.resernur.api.dtos.places.*;
import com.resernur.api.services.places.PlaceEquipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PlaceEquipmentController {

    @Autowired
    private PlaceEquipmentService equipmentService;

    // Create equipment for a place
    @PostMapping("/places/{placeId}/equipment")
    public ResponseEntity<?> createEquipment(@PathVariable int placeId, @RequestBody PlaceEquipmentCreateDTO dto) {
        try {
            dto.setPlaceId(placeId);
            PlaceEquipmentResponseDTO created = equipmentService.createEquipment(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Update equipment fully
    @PutMapping("/equipment/{equipmentId}")
    public ResponseEntity<?> updateEquipment(@PathVariable int equipmentId, @RequestBody PlaceEquipmentUpdateDTO dto) {
        try {
            PlaceEquipmentResponseDTO updated = equipmentService.updateEquipment(equipmentId, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Change state
    @PatchMapping("/equipment/{equipmentId}/state")
    public ResponseEntity<?> changeState(@PathVariable int equipmentId, @RequestBody ModifyStatusPlaceEquipmentDTO body) {
        try {
            String state = body.getStatus().toString();
            PlaceEquipmentResponseDTO dto = equipmentService.changeState(equipmentId, state);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Move equipment
    @PostMapping("/equipment/{equipmentId}/move")
    public ResponseEntity<?> moveEquipment(@PathVariable int equipmentId, @RequestBody MovePlaceEquipmentDTO body) {
        try {
            Integer newPlaceId = body.getNewPlaceId();
            if (newPlaceId == 0) return ResponseEntity.badRequest().body("newPlaceId is required");
            PlaceEquipmentResponseDTO dto = equipmentService.moveEquipment(equipmentId, newPlaceId);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Get all equipments for a place
    @GetMapping("/places/{placeId}/equipment")
    public ResponseEntity<List<PlaceEquipmentResponseDTO>> getEquipmentsByPlace(@PathVariable int placeId) {
        List<PlaceEquipmentResponseDTO> list = equipmentService.getEquipmentsByPlace(placeId);
        return ResponseEntity.ok(list);
    }

    // Modify quantity
    @PatchMapping("/equipment/{equipmentId}/quantity")
    public ResponseEntity<?> modifyQuantity(@PathVariable int equipmentId, @RequestBody ModifyQuantityPlaceEquipmentDTO body) {
        try {
            Integer qty = body.getQuantity();
            if (qty == 0) return ResponseEntity.badRequest().body("quantity is required");
            PlaceEquipmentResponseDTO dto = equipmentService.modifyQuantity(equipmentId, qty);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/equipment/{equipmentId}")
    public ResponseEntity<?> deleteEquipment(@PathVariable int equipmentId) {
        boolean deleted = equipmentService.deleteEquipment(equipmentId);
        if (deleted) return ResponseEntity.noContent().build();
        return ResponseEntity.notFound().build();
    }
}
