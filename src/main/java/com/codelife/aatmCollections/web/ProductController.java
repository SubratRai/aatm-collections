package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.ProductDtos;
import com.codelife.aatmCollections.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductDtos.ProductResponse> list(@RequestParam(required = false) String search) {
        return productService.listPublic(search);
    }

    @GetMapping("/{id}")
    public ProductDtos.ProductResponse get(@PathVariable UUID id) {
        return productService.getPublic(id);
    }
}
