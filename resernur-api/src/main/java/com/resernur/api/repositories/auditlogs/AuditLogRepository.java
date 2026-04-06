package com.resernur.api.repositories.auditlogs;

import com.resernur.api.models.auditlogs.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
}
