package com.resernur.api.repositories.auditlogs;

import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @Query("SELECT a FROM AuditLog a " +
            "WHERE (:executorId IS NULL OR a.executorId = :executorId) " +
            "AND (:entityName IS NULL OR a.entityName = :entityName) " +
            "AND (:entityId IS NULL OR a.entityId = :entityId) " +
            "AND (:action IS NULL OR a.action = :action) ")
    Page<AuditLog> findForSearch(
            Integer executorId,
            String entityName,
            Integer entityId,
            Actions action,
            Pageable pageable
    );

}
