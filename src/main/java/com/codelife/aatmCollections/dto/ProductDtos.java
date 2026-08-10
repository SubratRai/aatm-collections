package com.codelife.aatmCollections.dto;

import com.codelife.aatmCollections.domain.PaymentOptions;
import lombok.Data;

import java.math.BigDecimal;

public final class ProductDtos {
    private ProductDtos() {}

    public record ProductFilter(
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            String sort) {
    }

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
        private java.util.List<String> imageUrls;
        private int stockQty;
        private boolean active;
        private PaymentOptions paymentOptions;
    }
}
