package com.codelife.aatmCollections.entity;

import com.codelife.aatmCollections.domain.PaymentOptions;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "erp_product_id", unique = true, length = 100)
    private String erpProductId;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(length = 100)
    private String category;

    /** Primary / cover image (first of imageUrls). Kept for list cards and cart. */
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /** Full gallery synced from Retail360. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "url", columnDefinition = "TEXT")
    @OrderColumn(name = "sort_order")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @Column(name = "stock_qty", nullable = false)
    @Builder.Default
    private int stockQty = 0;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_manually_overridden")
    @Builder.Default
    private boolean manuallyOverridden = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_options", length = 20)
    @Builder.Default
    private PaymentOptions paymentOptions = PaymentOptions.BOTH;

    @Column(name = "last_full_sync_at")
    private Instant lastFullSyncAt;

    @Column(name = "last_stock_sync_at")
    private Instant lastStockSyncAt;

    @Version
    private Long version;

    /** Keep imageUrl aligned with the first gallery entry. */
    public void applyImageGallery(List<String> urls) {
        List<String> clean = urls == null ? List.of() : urls.stream()
                .filter(u -> u != null && !u.isBlank())
                .distinct()
                .toList();
        if (this.imageUrls == null) {
            this.imageUrls = new ArrayList<>();
        } else {
            this.imageUrls.clear();
        }
        this.imageUrls.addAll(clean);
        this.imageUrl = clean.isEmpty() ? null : clean.get(0);
    }
}
