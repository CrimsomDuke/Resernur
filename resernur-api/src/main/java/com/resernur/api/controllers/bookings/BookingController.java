package com.resernur.api.controllers.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.services.bookings.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping("/{id}")
    public ResponseEntity<StandardResult<BookingDTO>> getById(@PathVariable int id) {
        var res = bookingService.getById(id);
        if (!res.isSuccess()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        return ResponseEntity.ok(res);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<BookingDTO>> search(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam(value = "ongoing", required = false) Boolean ongoing,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize
    ) {
        BookingStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = BookingStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(new PagedResponse<BookingDTO>());
            }
        }
        var q = new SearchQuery(null, page, pageSize);
        var res = bookingService.search(q, st, userId, ongoing);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<StandardResult<Void>> cancel(@PathVariable int id) {
        var res = bookingService.cancelBooking(id);
        if (!res.isSuccess()) {
            if (res.getErrorMessage() != null && res.getErrorMessage().toLowerCase().contains("not found"))
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

}
