package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.domain.OrderStatus;
import com.codelife.aatmCollections.domain.PaymentStatus;
import com.codelife.aatmCollections.dto.OrderDtos;
import com.codelife.aatmCollections.entity.*;
import com.codelife.aatmCollections.erp.ErpOrderPushService;
import com.codelife.aatmCollections.erp.ErpSyncService;
import com.codelife.aatmCollections.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final ShopOrderRepository orders;
    private final CartItemRepository cartItems;
    private final AddressRepository addresses;
    private final UserAccountRepository users;
    private final ProductRepository products;
    private final ErpOrderPushService erpOrderPushService;
    private final ErpSyncService erpSyncService;

    private UserAccount user(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @Transactional
    public OrderDtos.OrderResponse checkout(String email, OrderDtos.CheckoutRequest request) {
        UserAccount account = user(email);
        List<CartItem> items = cartItems.findByUserOrderByAddedAtDesc(account);
        if (items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        // Pull live quantities from Retail360 before allowing checkout.
        try {
            erpSyncService.refreshStockForProducts(items.stream().map(CartItem::getProduct).toList());
        } catch (Exception e) {
            log.warn("Pre-checkout stock refresh failed, continuing with local cache: {}", e.getMessage());
        }

        // Validate stock before committing anything.
        for (CartItem item : items) {
            Product p = item.getProduct();
            if (!p.isActive() || item.getQuantity() > p.getStockQty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Insufficient stock for " + p.getName() + " (available: " + p.getStockQty() + ")");
            }
            if ((p.getErpProductId() == null || p.getErpProductId().isBlank())
                    && (p.getSku() == null || p.getSku().isBlank())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Product \"" + p.getName() + "\" is not linked to Retail360. Sync the catalog from Admin first.");
            }
        }

        Address address = addresses.save(Address.builder()
                .user(account)
                .label("Delivery")
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .phone(request.getPhone())
                .build());

        ShopOrder order = ShopOrder.builder()
                .user(account)
                .address(address)
                .status(OrderStatus.CONFIRMED)
                .paymentStatus("COD".equalsIgnoreCase(request.getPaymentMethod())
                        ? PaymentStatus.PENDING : PaymentStatus.UNPAID)
                .paymentMethod(request.getPaymentMethod())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem cartItem : items) {
            Product p = cartItem.getProduct();
            order.addItem(OrderItem.builder()
                    .order(order)
                    .erpProductId(p.getErpProductId())
                    .sku(p.getSku())
                    .productName(p.getName())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(p.getPrice())
                    .build());
            total = total.add(p.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));

            // Local stock cache decrement; ERP is source of truth and deducts on its side too.
            p.setStockQty(Math.max(0, p.getStockQty() - cartItem.getQuantity()));
            products.save(p);
        }
        order.setTotalAmount(total);
        ShopOrder saved = orders.save(order);

        cartItems.deleteByUser(account);

        // Queue the order for Retail360 (customer + finance + delivery details).
        erpOrderPushService.enqueue(saved, account, request);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderDtos.OrderResponse> myOrders(String email) {
        return orders.findByUserOrderByCreatedAtDesc(user(email)).stream()
                .map(this::toDto)
                .toList();
    }

    private OrderDtos.OrderResponse toDto(ShopOrder order) {
        OrderDtos.OrderResponse dto = new OrderDtos.OrderResponse();
        dto.setId(order.getId().toString());
        dto.setStatus(order.getStatus().name());
        dto.setPaymentStatus(order.getPaymentStatus().name());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setErpOrderId(order.getErpOrderId());
        dto.setCreatedAt(order.getCreatedAt());
        Address a = order.getAddress();
        if (a != null) {
            dto.setDeliveryAddress(Stream.of(a.getLine1(), a.getLine2(), a.getCity(), a.getState(),
                            a.getPostalCode(), a.getCountry())
                    .filter(s -> s != null && !s.isBlank())
                    .reduce((x, y) -> x + ", " + y)
                    .orElse(""));
        }
        dto.setItems(order.getItems().stream().map(item -> {
            OrderDtos.OrderItemResponse i = new OrderDtos.OrderItemResponse();
            i.setSku(item.getSku());
            i.setName(item.getProductName());
            i.setQuantity(item.getQuantity());
            i.setUnitPrice(item.getUnitPrice());
            i.setLineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            return i;
        }).toList());
        return dto;
    }
}
