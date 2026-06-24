package com.resernur.api.services.auditlogs;

import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.repositories.auditlogs.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import javax.swing.*;

@Service
public class LogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logAction(Actions action, String description, int executorId, String entityName, int entityId) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDescription(description);
        log.setExecutorId(executorId);
        log.setEntityName(entityName);
        log.setEntityId(entityId);

        auditLogRepository.save(log);
    }

    public void logAction(Actions actions, int executorId, String entityName, int entityId) {
        logAction(actions, "", executorId, entityName, entityId);
    }

    public PagedResponse<AuditLog> searchLogs(Integer executorId, String entityName, Integer entityId, Actions action, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, int page, int pageSize) {
        java.time.LocalDateTime safeStart = startDate != null ? startDate : java.time.LocalDateTime.of(1970,1,1,0,0);
        java.time.LocalDateTime safeEnd = endDate != null ? endDate : java.time.LocalDateTime.of(3000,1,1,23,59,59);
        Page<AuditLog> logs = auditLogRepository.findForSearch(executorId, entityName, entityId, action, safeStart, safeEnd, org.springframework.data.domain.PageRequest.of(page, pageSize));
        PagedResponse<AuditLog> response = new PagedResponse<>();
        response.setContent(logs.getContent());
        response.setPageSize(pageSize);
        response.setSuccess(true);
        response.setPageNumber(logs.getNumber());
        response.setTotalElements(logs.getTotalElements());
        response.setTotalPages(logs.getTotalPages());
        return response;
    }


}
