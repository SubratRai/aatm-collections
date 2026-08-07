package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.OrderDtos;
import com.codelife.aatmCollections.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public List<OrderDtos.OrderResponse> myOrders(Authentication auth) {
        return orderService.myOrders(auth.getName());
    }

    @PostMapping("/checkout")
    public OrderDtos.OrderResponse checkout(Authentication auth,
                                            @Valid @RequestBody OrderDtos.CheckoutRequest request) {
        return orderService.checkout(auth.getName(), request);
    }
}
