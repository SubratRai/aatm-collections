package com.codelife.aatmCollections.erp;

import com.codelife.aatmCollections.config.ErpProperties;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Pulls the Retail360 e-commerce catalog into the local product cache.
 * Products manually edited by the Aatm admin (manuallyOverridden) keep
 * their local values; only stock is refreshed for them.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ErpSyncService {

    private final ErpClient erpClient;
    private final ProductRepository products;
    private final ErpProperties props;

    private volatile Instant lastSyncAt;
    private volatile String lastSyncSummary = "Never synced";

    @Transactional
    public SyncResult syncCatalog() {
        List<ErpClient.ErpCatalogItem> items = erpClient.fetchCatalog();
        int created = 0;
        int updated = 0;
        int skippedNoPrice = 0;
        int stockOnly = 0;

        for (ErpClient.ErpCatalogItem item : items) {
            if (item.erpProductId() == null || item.sku() == null || item.name() == null) {
                continue;
            }

            Optional<Product> existing = products.findByErpProductId(item.erpProductId())
                    .or(() -> products.findBySku(item.sku()));

            if (existing.isPresent()) {
                Product p = existing.get();
                p.setErpProductId(item.erpProductId());
                if (p.isManuallyOverridden()) {
                    // Respect admin edits; stock is still ERP-owned.
                    p.setStockQty(item.stockQty());
                    p.setLastStockSyncAt(Instant.now());
                    stockOnly++;
                } else {
                    p.setName(item.name());
                    p.setDescription(item.description());
                    p.setCategory(item.category());
                    if (item.imageUrl() != null) p.setImageUrl(item.imageUrl());
                    if (item.price() != null) p.setPrice(item.price());
                    p.setStockQty(item.stockQty());
                    p.setActive(item.price() != null);
                    p.setLastFullSyncAt(Instant.now());
                    p.setLastStockSyncAt(Instant.now());
                    updated++;
                }
                products.save(p);
            } else {
                if (item.price() == null) {
                    // Cannot sell without a channel/vendor price on Retail360.
                    skippedNoPrice++;
                    continue;
                }
                products.save(Product.builder()
                        .erpProductId(item.erpProductId())
                        .sku(item.sku())
                        .name(item.name())
                        .description(item.description())
                        .category(item.category())
                        .imageUrl(item.imageUrl())
                        .price(item.price())
                        .stockQty(item.stockQty())
                        .active(true)
                        .lastFullSyncAt(Instant.now())
                        .lastStockSyncAt(Instant.now())
                        .build());
                created++;
            }
        }

        lastSyncAt = Instant.now();
        SyncResult result = new SyncResult(items.size(), created, updated, stockOnly, skippedNoPrice, lastSyncAt);
        lastSyncSummary = "%d ERP items: %d created, %d updated, %d stock-only (admin-edited), %d skipped (no price)"
                .formatted(items.size(), created, updated, stockOnly, skippedNoPrice);
        log.info("ERP catalog sync done: {}", lastSyncSummary);
        return result;
    }

    /** Optional background sync every 15 minutes when enabled via config. */
    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT2M")
    public void scheduledSync() {
        if (!props.isScheduledSyncEnabled()) return;
        try {
            syncCatalog();
        } catch (Exception e) {
            log.warn("Scheduled ERP sync failed: {}", e.getMessage());
        }
    }

    public SyncStatus status() {
        return new SyncStatus(props.getBaseUrl(), props.getChannelCode(),
                props.isScheduledSyncEnabled(), lastSyncAt, lastSyncSummary);
    }

    public record SyncResult(int totalErpItems, int created, int updated,
                             int stockOnlyUpdated, int skippedNoPrice, Instant syncedAt) {
    }

    public record SyncStatus(String erpBaseUrl, String channelCode, boolean scheduledSyncEnabled,
                             Instant lastSyncAt, String lastSyncSummary) {
    }
}
