package com.resernur.api.controllers.auditlogs;

import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.services.auditlogs.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private LogService logService;

    @GetMapping
    public ResponseEntity<PagedResponse<AuditLog>> search(
            @RequestParam(value = "executorId", required = false) Integer executorId,
            @RequestParam(value = "entityName", required = false) String entityName,
            @RequestParam(value = "entityId", required = false) Integer entityId,
            @RequestParam(value = "action", required = false) Actions action,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize
    ){
        try{
            java.time.LocalDateTime start = null;
            java.time.LocalDateTime end = null;
            if (startDate != null && !startDate.isBlank()) {
                start = java.time.LocalDateTime.parse(startDate);
            }
            if (endDate != null && !endDate.isBlank()) {
                end = java.time.LocalDateTime.parse(endDate);
            }
            return ResponseEntity.ok(logService.searchLogs(executorId, entityName, entityId, action, start, end, page, pageSize));
        }catch (Exception ex){
            PagedResponse<AuditLog> resp = new PagedResponse<>();
            resp.setSuccess(false);
            resp.setErrorMessage(ex.getMessage());
            return ResponseEntity.badRequest().body(resp);
        }
    }

}
