package com.codelife.aatmCollections.erp;

import com.codelife.aatmCollections.config.ErpProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Pulls Retail360 catalog shortly after boot so the storefront is not stuck
 * on local seed products / an empty cache.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ErpStartupSync {

    private final ErpSyncService erpSyncService;
    private final ErpProperties props;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        Thread t = new Thread(() -> {
            try {
                Thread.sleep(4000);
                log.info("Starting startup ERP catalog sync from {}", props.getBaseUrl());
                erpSyncService.syncCatalog();
            } catch (Exception e) {
                log.warn("Startup ERP sync failed (use Admin → Catalog Sync, or wait for scheduled): {}",
                        e.getMessage());
            }
        }, "erp-startup-sync");
        t.setDaemon(true);
        t.start();
    }
}
