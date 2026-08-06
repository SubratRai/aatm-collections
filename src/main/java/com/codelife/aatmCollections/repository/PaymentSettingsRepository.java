package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.PaymentSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, UUID> {
    Optional<PaymentSettings> findFirstByOrderByUpdatedAtDesc();
}
