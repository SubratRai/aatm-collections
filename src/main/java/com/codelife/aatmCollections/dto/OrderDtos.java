package com.codelife.aatmCollections.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    @Data
    public static class CheckoutRequest {
        @NotBlank
        private String fullName;
        @NotBlank
        @Pattern(regexp = "\\+?[0-9 -]{10,15}", message = "Phone must have at least 10 digits")
        private String phone;
        @NotBlank
        private String line1;
        private String line2;
        @NotBlank
        private String city;
        private String state;
        @NotBlank
        private String postalCode;
        private String country = "India";
        private String paymentMethod = "COD";
    }

    @Data
    public static class OrderItemResponse {
        private String sku;
        private String name;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }

    @Data
    public static class OrderResponse {
        private String id;
        private String status;
        private String paymentStatus;
        private String paymentMethod;
        private BigDecimal totalAmount;
        private String erpOrderId;
        private String deliveryAddress;
        private Instant createdAt;
        private List<OrderItemResponse> items;
    }
}
