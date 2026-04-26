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

    public PagedResponse<AuditLog> searchLogs(Integer executorId, String entityName, Integer entityId, Actions action, int page, int pageSize) {
        Page<AuditLog> logs = auditLogRepository.findForSearch(executorId, entityName, entityId, action, org.springframework.data.domain.PageRequest.of(page, pageSize));
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
