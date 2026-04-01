package com.resernur.api.controllers.users;

import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.users.UserDTO;
import com.resernur.api.dtos.users.UserUpdateDTO;
import com.resernur.api.services.users.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // Get current user based on Authorization header
    @GetMapping("/me")
    public ResponseEntity<StandardResult<UserDTO>> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authorization) {
        var res = userService.getMe(authorization);
        if (!res.isSuccess()) {
            String msg = res.getErrorMessage() == null ? "" : res.getErrorMessage().toLowerCase();
            if (msg.contains("invalid token") || msg.contains("invalid authorization")) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Get user by id
    @GetMapping("/{id}")
    public ResponseEntity<StandardResult<UserDTO>> getById(@PathVariable Long id) {
        var res = userService.getById(id);
        if (!res.isSuccess()) {
            if (res.getErrorMessage() != null && res.getErrorMessage().toLowerCase().contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<StandardResult<UserDTO>> update(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
        if (dto == null) return ResponseEntity.badRequest().body(new StandardResult<>(false, "Invalid payload", null));
        dto.setId(id);
        var res = userService.update(dto);
        if (!res.isSuccess()) {
            String msg = res.getErrorMessage() == null ? "" : res.getErrorMessage().toLowerCase();
            if (msg.contains("not found")) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // Search users (paginated)
    @GetMapping
    public ResponseEntity<PagedResponse<UserDTO>> search(
            @RequestParam(value = "term", required = false) String term,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize
    ) {
        var q = new SearchQuery(term, page, pageSize);
        var res = userService.search(term, q);
        return ResponseEntity.ok(res);
    }

}
