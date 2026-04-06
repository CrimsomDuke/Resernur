package com.resernur.api.models.auditlogs;

import com.resernur.api.models.enums.Actions;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class AuditLog {

    @Id
    @GeneratedValue
    private int Id;


    @Enumerated(EnumType.STRING)
    @Column(length = 100)
    private Actions action;

    @Column(nullable = true, length = 255)
    private String description;

    @Column
    private int executorId;

    @Column(length = 100)
    private String entityName;

    @Column
    private int entityId;

    @CreatedDate
    private LocalDateTime timestamp = LocalDateTime.now();
}
