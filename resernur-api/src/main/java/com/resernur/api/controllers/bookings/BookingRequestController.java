package com.resernur.api.controllers.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.services.bookings.BookingRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/booking-requests")
public class BookingRequestController {

    @Autowired
    private BookingRequestService bookingRequestService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StandardResult<BookingRequestDTO>> create(@ModelAttribute BookingRequestCreateDTO dto) {
        var res = bookingRequestService.createBookingRequest(dto);
        if (!res.isSuccess()) return ResponseEntity.badRequest().body(res);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResult<BookingRequestDTO>> getById(@PathVariable int id) {
        var res = bookingRequestService.getById(id);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<BookingRequestDTO>> getByUserPaged(@PathVariable int userId,
                                                                          @RequestParam(value = "page", defaultValue = "0") int page,
                                                                          @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        var q = new SearchQuery(null, page, pageSize);
        return ResponseEntity.ok(bookingRequestService.getByUserPaged(userId, q));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<BookingRequestDTO>> getAllPaged(@RequestParam(value = "status", required = false) String status,
                                                                         @RequestParam(value = "page", defaultValue = "0") int page,
                                                                         @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        BookingRequestStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = BookingRequestStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(new PagedResponse<BookingRequestDTO>());
            }
        }
        var q = new SearchQuery(null, page, pageSize);
        return ResponseEntity.ok(bookingRequestService.getAllPaged(q, st));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<StandardResult<BookingRequestDTO>> accept(@PathVariable int id) {
        var res = bookingRequestService.acceptRequest(id);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<StandardResult<BookingRequestDTO>> reject(@PathVariable int id, @RequestBody ReasonBody body) {
        var res = bookingRequestService.rejectRequest(id, body.reason);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/request-changes")
    public ResponseEntity<StandardResult<BookingRequestDTO>> requestChanges(@PathVariable int id, @RequestBody ReasonBody body) {
        var res = bookingRequestService.requestChanges(id, body.reason);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StandardResult<BookingRequestDTO>> updateByRequester(@PathVariable int id, @RequestBody BookingRequestUpdateDTO dto) {
        if (dto.getId() != id) dto.setId(id);
        var res = bookingRequestService.updateByRequester(id, dto);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            if (res.getErrorMessage().toLowerCase().contains("unauthorized")) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<StandardResult<Void>> deleteRequest(@PathVariable int id, @RequestParam("requesterId") int requesterId) {
        var res = bookingRequestService.delete(id, requesterId);
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            if (res.getErrorMessage().toLowerCase().contains("unauthorized")) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.noContent().build();
    }

    // Simple body holder for reject/request-changes endpoints
    public static class ReasonBody {
        public String reason;
    }
}
