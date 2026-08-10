package com.codelife.aatmCollections.erp;

import com.codelife.aatmCollections.config.ErpProperties;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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
    private volatile Instant lastStockSyncAt;
    private volatile String lastStockSyncSummary = "Never synced stock";

    @Transactional
    public SyncResult syncCatalog() {
        List<ErpClient.ErpCatalogItem> items = erpClient.fetchCatalog();
        int created = 0;
        int updated = 0;
        int skippedNoPrice = 0;
        int stockOnly = 0;
        int linkedLocal = 0;
        Set<String> seenErpIds = new HashSet<>();

        for (ErpClient.ErpCatalogItem item : items) {
            if (item.erpProductId() == null || item.erpProductId().isBlank()) {
                continue;
            }
            if (item.sku() == null || item.sku().isBlank() || item.name() == null || item.name().isBlank()) {
                continue;
            }

            seenErpIds.add(item.erpProductId());
            BigDecimal price = item.price() != null ? item.price() : BigDecimal.ZERO;
            boolean hasPrice = item.price() != null && item.price().compareTo(BigDecimal.ZERO) > 0;

            Optional<Product> existing = products.findByErpProductId(item.erpProductId())
                    .or(() -> products.findBySku(item.sku()));

            if (existing.isPresent()) {
                Product p = existing.get();
                boolean wasUnlinked = p.getErpProductId() == null || p.getErpProductId().isBlank();
                p.setErpProductId(item.erpProductId());
                if (wasUnlinked) linkedLocal++;

                if (p.isManuallyOverridden()) {
                    // Respect admin edits; stock is still ERP-owned.
                    p.setStockQty(item.stockQty());
                    p.setLastStockSyncAt(Instant.now());
                    stockOnly++;
                } else {
                    p.setSku(item.sku());
                    p.setName(item.name());
                    p.setDescription(item.description());
                    p.setCategory(item.category());
                    if (item.imageUrl() != null) p.setImageUrl(item.imageUrl());
                    if (hasPrice) {
                        p.setPrice(item.price());
                    } else if (p.getPrice() == null || p.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                        p.setPrice(price);
                    }
                    p.setStockQty(item.stockQty());
                    p.setActive(hasPrice || (p.getPrice() != null && p.getPrice().compareTo(BigDecimal.ZERO) > 0));
                    p.setLastFullSyncAt(Instant.now());
                    p.setLastStockSyncAt(Instant.now());
                    updated++;
                }
                products.save(p);
            } else {
                if (!hasPrice) {
                    skippedNoPrice++;
                }
                products.save(Product.builder()
                        .erpProductId(item.erpProductId())
                        .sku(item.sku())
                        .name(item.name())
                        .description(item.description())
                        .category(item.category())
                        .imageUrl(item.imageUrl())
                        .price(hasPrice ? price : BigDecimal.ZERO)
                        .stockQty(item.stockQty())
                        .active(hasPrice)
                        .lastFullSyncAt(Instant.now())
                        .lastStockSyncAt(Instant.now())
                        .build());
                created++;
            }
        }

        int deactivatedLocal = 0;
        for (Product local : products.findAll()) {
            String erpId = local.getErpProductId();
            if (erpId == null || erpId.isBlank()) {
                if (local.isActive()) {
                    local.setActive(false);
                    products.save(local);
                    deactivatedLocal++;
                }
            } else if (!seenErpIds.isEmpty() && !seenErpIds.contains(erpId) && local.isActive()
                    && !local.isManuallyOverridden()) {
                local.setActive(false);
                products.save(local);
                deactivatedLocal++;
            }
        }

        lastSyncAt = Instant.now();
        lastStockSyncAt = lastSyncAt;
        SyncResult result = new SyncResult(
                items.size(), created, updated, stockOnly, skippedNoPrice, linkedLocal, deactivatedLocal, lastSyncAt);
        lastSyncSummary = "%d ERP items: %d created, %d updated, %d stock-only, %d no-price imported, %d local linked, %d deactivated"
                .formatted(items.size(), created, updated, stockOnly, skippedNoPrice, linkedLocal, deactivatedLocal);
        lastStockSyncSummary = "Stock refreshed with full product sync (%d items)".formatted(items.size());
        log.info("ERP catalog sync done: {}", lastSyncSummary);
        return result;
    }

    /**
     * Quantity-only sync from Retail360. Used by the 1-minute scheduler and
     * the admin "Refresh stock" action.
     */
    @Transactional
    public StockSyncResult syncStock() {
        List<ErpClient.ErpCatalogItem> items = erpClient.fetchCatalog();
        Map<String, Integer> stockByErpId = new HashMap<>();
        for (ErpClient.ErpCatalogItem item : items) {
            if (item.erpProductId() != null && !item.erpProductId().isBlank()) {
                stockByErpId.put(item.erpProductId(), item.stockQty());
            }
        }

        int checked = 0;
        int changed = 0;
        for (Product local : products.findAll()) {
            String erpId = local.getErpProductId();
            if (erpId == null || erpId.isBlank() || !stockByErpId.containsKey(erpId)) {
                continue;
            }
            checked++;
            int qty = stockByErpId.get(erpId);
            if (local.getStockQty() != qty) {
                local.setStockQty(qty);
                changed++;
            }
            local.setLastStockSyncAt(Instant.now());
            products.save(local);
        }

        lastStockSyncAt = Instant.now();
        lastStockSyncSummary = "%d products checked, %d quantities updated".formatted(checked, changed);
        log.info("ERP stock sync done: {}", lastStockSyncSummary);
        return new StockSyncResult(checked, changed, lastStockSyncAt);
    }

    /**
     * Live stock refresh for specific products (used right before checkout).
     * Updates the managed Product entities in-place.
     */
    @Transactional
    public void refreshStockForProducts(Collection<Product> cartProducts) {
        Instant now = Instant.now();
        int refreshed = 0;
        for (Product p : cartProducts) {
            if (p == null) continue;
            String erpId = p.getErpProductId();
            try {
                ErpClient.ErpCatalogItem live;
                if (erpId != null && !erpId.isBlank()) {
                    live = erpClient.fetchProduct(erpId);
                } else if (p.getSku() != null && !p.getSku().isBlank()) {
                    // Fall back to catalog scan by SKU if erp id missing
                    live = erpClient.fetchCatalog().stream()
                            .filter(i -> p.getSku().equalsIgnoreCase(i.sku()))
                            .findFirst()
                            .orElse(null);
                    if (live == null) continue;
                    if (live.erpProductId() != null) {
                        p.setErpProductId(live.erpProductId());
                    }
                } else {
                    continue;
                }
                p.setStockQty(live.stockQty());
                p.setLastStockSyncAt(now);
                products.save(p);
                refreshed++;
            } catch (Exception e) {
                log.warn("Pre-checkout stock refresh failed for {}: {}", p.getSku(), e.getMessage());
            }
        }
        if (refreshed > 0) {
            lastStockSyncAt = now;
            lastStockSyncSummary = "Pre-checkout refresh: %d product(s)".formatted(refreshed);
        }
    }

    /** Full product details sync every 15 minutes when enabled. */
    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT2M")
    public void scheduledCatalogSync() {
        if (!props.isScheduledSyncEnabled()) return;
        try {
            syncCatalog();
        } catch (Exception e) {
            log.warn("Scheduled ERP catalog sync failed: {}", e.getMessage());
        }
    }

    /** Quantity sync every minute so storefront stock stays close to Retail360. */
    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    public void scheduledStockSync() {
        if (!props.isStockSyncEnabled()) return;
        try {
            syncStock();
        } catch (Exception e) {
            log.warn("Scheduled ERP stock sync failed: {}", e.getMessage());
        }
    }

    public SyncStatus status() {
        return new SyncStatus(
                props.getBaseUrl(),
                props.getChannelCode(),
                props.isScheduledSyncEnabled(),
                props.isStockSyncEnabled(),
                lastSyncAt,
                lastSyncSummary,
                lastStockSyncAt,
                lastStockSyncSummary);
    }

    public record SyncResult(int totalErpItems, int created, int updated,
                             int stockOnlyUpdated, int skippedNoPrice, int linkedLocal,
                             int deactivatedLocal, Instant syncedAt) {
    }

    public record StockSyncResult(int checked, int changed, Instant syncedAt) {
    }

    public record SyncStatus(String erpBaseUrl, String channelCode,
                             boolean scheduledSyncEnabled, boolean stockSyncEnabled,
                             Instant lastSyncAt, String lastSyncSummary,
                             Instant lastStockSyncAt, String lastStockSyncSummary) {
    }
}
