package com.codelife.aatmCollections.dto;

import com.codelife.aatmCollections.domain.PaymentOptions;
import lombok.Data;

import java.math.BigDecimal;

public final class ProductDtos {
    private ProductDtos() {}

    @Data
    public static class ProductResponse {
        private String id;
        private String erpProductId;
        private String sku;
        private String name;
        private String description;
        private BigDecimal price;
        private String category;
        private String imageUrl;
        private int stockQty;
        private boolean active;
        private PaymentOptions paymentOptions;
    }
}
