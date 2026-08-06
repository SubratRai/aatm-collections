package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SiteSettingsRepository extends JpaRepository<SiteSettings, UUID> {
    Optional<SiteSettings> findFirstByOrderByUpdatedAtDesc();
}
