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

import static org.mockito.ArgumentMatchers.any;
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
                .thenReturn(any(AuditLog.class));

        //act
        logService.logAction(action, desc, executorId, entityName, entityId);

        //assert
        Mockito.verify(auditLogRepository, Mockito.times(1)).save(any(AuditLog.class));

    }

}
