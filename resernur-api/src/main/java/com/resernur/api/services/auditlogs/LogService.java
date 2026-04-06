package com.resernur.api.services.auditlogs;

import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.repositories.auditlogs.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
