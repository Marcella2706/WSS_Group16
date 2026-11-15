package com.wss.csrf.repository;

import com.wss.csrf.model.AuditEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRepository extends JpaRepository<AuditEntry, Long> {
    List<AuditEntry> findAllByOrderByCreatedAtDesc();
}
