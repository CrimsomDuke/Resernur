package com.resernur.api.unittest.services.auditlogs;

import com.resernur.api.models.auditlogs.AuditLog;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.repositories.auditlogs.AuditLogRepository;
import com.resernur.api.services.auditlogs.LogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.internal.verification.Times;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.Month;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LogServiceTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private LogService logService;


    @Test
    public void logAction_Success(){

        //arrange
        Actions action = Actions.READ;
        String desc = "Test description";
        int executorId = 10;
        String entityName = "BOOKINGS";
        int entityId = 1;

        when(auditLogRepository.save(any(AuditLog.class)))
            .thenReturn(new AuditLog());

        //act
        logService.logAction(action, desc, executorId, entityName, entityId);

        //assert
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));

    }

    @Test
    public void logAction_NullAction_DoesNothing() {
        logService.logAction(null, "desc", 1, "ENTITY", 1);
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void logAction_NullEntityName_DoesNothing() {
        logService.logAction(Actions.CREATE, "desc", 1, null, 1);
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void logAction_NullDescription_DoesNothing() {
        logService.logAction(Actions.CREATE, null, 1, "ENTITY", 1);
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void logAction_NullExecutorId_DoesNothing() {
        logService.logAction(Actions.CREATE, "desc", 0, "ENTITY", 1);
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void logAction_NullEntityId_DoesNothing() {
        logService.logAction(Actions.CREATE, "desc", 1, "ENTITY", 0);
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void logAction_WithNoDescription_Success() {
        //arrange
        Actions action = Actions.UPDATE;
        int executorId = 20;
        String entityName = "USERS";
        int entityId = 2;

        when(auditLogRepository.save(any(AuditLog.class)))
            .thenReturn(new AuditLog());

        //act
        logService.logAction(action, executorId, entityName, entityId);

        //assert
        Mockito.verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void searchLogs_Success() {
        //arrange
        Integer executorId = 10;
        String entityName = "BOOKINGS";
        Integer entityId = 1;
        Actions action = Actions.READ;
        int page = 0;
        int pageSize = 10;
        LocalDateTime startDate = LocalDateTime.of(2026, Month.MAY, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2026, Month.MAY, 19, 23, 59, 59);

        when(auditLogRepository.findForSearch(executorId, entityName, entityId, action, startDate, endDate, org.springframework.data.domain.PageRequest.of(page, pageSize)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        //act
        logService.searchLogs(executorId, entityName, entityId, action, startDate, endDate, page, pageSize);

        //assert
        Mockito.verify(auditLogRepository, times(1)).findForSearch(executorId, entityName, entityId, action, startDate, endDate, org.springframework.data.domain.PageRequest.of(page, pageSize));
    }

}
