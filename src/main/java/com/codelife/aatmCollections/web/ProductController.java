package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.ProductDtos;
import com.codelife.aatmCollections.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductDtos.ProductResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sort) {
        return productService.listPublic(
                new ProductDtos.ProductFilter(search, category, minPrice, maxPrice, inStock, sort));
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return productService.listCategories();
    }

    @GetMapping("/{id}")
    public ProductDtos.ProductResponse get(@PathVariable UUID id) {
        return productService.getPublic(id);
    }
}
