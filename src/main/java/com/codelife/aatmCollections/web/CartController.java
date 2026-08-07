package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.CartDtos;
import com.codelife.aatmCollections.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartDtos.CartResponse get(Authentication auth) {
        return cartService.getCart(auth.getName());
    }

    @PostMapping("/items")
    public CartDtos.CartResponse add(Authentication auth, @Valid @RequestBody CartDtos.AddItemRequest request) {
        return cartService.addItem(auth.getName(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartDtos.CartResponse update(Authentication auth, @PathVariable UUID itemId,
                                        @Valid @RequestBody CartDtos.UpdateItemRequest request) {
        return cartService.updateItem(auth.getName(), itemId, request.getQuantity());
    }

    @DeleteMapping("/items/{itemId}")
    public CartDtos.CartResponse remove(Authentication auth, @PathVariable UUID itemId) {
        return cartService.removeItem(auth.getName(), itemId);
    }
}
