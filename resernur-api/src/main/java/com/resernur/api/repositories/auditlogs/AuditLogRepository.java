package com.resernur.api.repositories.auditlogs;

import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @Query("SELECT a FROM AuditLog a " +
            "WHERE (:executorId IS NULL OR a.executorId = :executorId) " +
            "AND (:entityName IS NULL OR a.entityName = :entityName) " +
            "AND (:entityId IS NULL OR a.entityId = :entityId) " +
            "AND (:action IS NULL OR a.action = :action) " +
            "AND a.timestamp BETWEEN COALESCE(:startDate, a.timestamp) AND COALESCE(:endDate, a.timestamp) ")
    Page<AuditLog> findForSearch(
            @Param("executorId") Integer executorId,
            @Param("entityName") String entityName,
            @Param("entityId") Integer entityId,
            @Param("action") Actions action,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

}
