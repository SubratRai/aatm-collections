package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.dto.CartDtos;
import com.codelife.aatmCollections.entity.CartItem;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.entity.UserAccount;
import com.codelife.aatmCollections.repository.CartItemRepository;
import com.codelife.aatmCollections.repository.ProductRepository;
import com.codelife.aatmCollections.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItems;
    private final ProductRepository products;
    private final UserAccountRepository users;

    private UserAccount user(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @Transactional(readOnly = true)
    public CartDtos.CartResponse getCart(String email) {
        return toCartResponse(cartItems.findByUserOrderByAddedAtDesc(user(email)));
    }

    @Transactional
    public CartDtos.CartResponse addItem(String email, CartDtos.AddItemRequest request) {
        UserAccount account = user(email);
        Product product = products.findById(request.getProductId())
                .filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        CartItem item = cartItems.findByUserAndProductId(account, product.getId()).orElse(null);
        int newQty = (item == null ? 0 : item.getQuantity()) + request.getQuantity();
        if (newQty > product.getStockQty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only " + product.getStockQty() + " in stock for " + product.getName());
        }
        if (item == null) {
            item = CartItem.builder().user(account).product(product).quantity(newQty).build();
        } else {
            item.setQuantity(newQty);
        }
        cartItems.save(item);
        return toCartResponse(cartItems.findByUserOrderByAddedAtDesc(account));
    }

    @Transactional
    public CartDtos.CartResponse updateItem(String email, UUID itemId, int quantity) {
        UserAccount account = user(email);
        CartItem item = cartItems.findById(itemId)
                .filter(ci -> ci.getUser().getId().equals(account.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (quantity > item.getProduct().getStockQty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only " + item.getProduct().getStockQty() + " in stock for " + item.getProduct().getName());
        }
        item.setQuantity(quantity);
        cartItems.save(item);
        return toCartResponse(cartItems.findByUserOrderByAddedAtDesc(account));
    }

    @Transactional
    public CartDtos.CartResponse removeItem(String email, UUID itemId) {
        UserAccount account = user(email);
        cartItems.findById(itemId)
                .filter(ci -> ci.getUser().getId().equals(account.getId()))
                .ifPresent(cartItems::delete);
        return toCartResponse(cartItems.findByUserOrderByAddedAtDesc(account));
    }

    private CartDtos.CartResponse toCartResponse(List<CartItem> items) {
        CartDtos.CartResponse response = new CartDtos.CartResponse();
        response.setItems(items.stream().map(this::toItemDto).toList());
        response.setTotal(response.getItems().stream()
                .map(CartDtos.CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        response.setItemCount(items.stream().mapToInt(CartItem::getQuantity).sum());
        return response;
    }

    private CartDtos.CartItemResponse toItemDto(CartItem item) {
        Product p = item.getProduct();
        CartDtos.CartItemResponse dto = new CartDtos.CartItemResponse();
        dto.setId(item.getId().toString());
        dto.setProductId(p.getId().toString());
        dto.setSku(p.getSku());
        dto.setName(p.getName());
        dto.setImageUrl(p.getImageUrl());
        dto.setUnitPrice(p.getPrice());
        dto.setQuantity(item.getQuantity());
        dto.setLineTotal(p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        dto.setStockQty(p.getStockQty());
        return dto;
    }
}
