package com.resernur.api.controllers.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestReasonBodyDTO;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.services.bookings.BookingRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/booking-requests")
public class BookingRequestController {

    @Autowired
    private BookingRequestService bookingRequestService;

    @PostMapping
    public ResponseEntity<StandardResult<BookingRequestDTO>> create(@RequestBody BookingRequestCreateDTO dto) {
        var res = bookingRequestService.createBookingRequest(dto);
        if (!res.isSuccess()) return ResponseEntity.badRequest().body(res);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
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
    public ResponseEntity<StandardResult<BookingRequestDTO>> reject(@PathVariable int id, @RequestBody BookingRequestReasonBodyDTO body) {
        var res = bookingRequestService.rejectRequest(id, body.getReason());
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/request-changes")
    public ResponseEntity<StandardResult<BookingRequestDTO>> requestChanges(@PathVariable int id, @RequestBody BookingRequestReasonBodyDTO body) {
        var res = bookingRequestService.requestChanges(id, body.getReason());
        if (!res.isSuccess()) {
            if (res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

}

