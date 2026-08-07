package com.codelife.aatmCollections.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class CartDtos {
    private CartDtos() {}

    @Data
    public static class AddItemRequest {
        @NotNull
        private UUID productId;
        @Min(1)
        private int quantity = 1;
    }

    @Data
    public static class UpdateItemRequest {
        @Min(1)
        private int quantity;
    }

    @Data
    public static class CartItemResponse {
        private String id;
        private String productId;
        private String sku;
        private String name;
        private String imageUrl;
        private BigDecimal unitPrice;
        private int quantity;
        private BigDecimal lineTotal;
        private int stockQty;
    }

    @Data
    public static class CartResponse {
        private List<CartItemResponse> items;
        private BigDecimal total;
        private int itemCount;
    }
}
