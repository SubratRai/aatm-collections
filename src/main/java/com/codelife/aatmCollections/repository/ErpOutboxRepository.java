package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.ErpOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ErpOutboxRepository extends JpaRepository<ErpOutbox, UUID> {
}
