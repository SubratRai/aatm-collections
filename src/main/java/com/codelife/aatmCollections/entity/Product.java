package com.codelife.aatmCollections.entity;

import com.codelife.aatmCollections.domain.PaymentOptions;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
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

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

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
}
