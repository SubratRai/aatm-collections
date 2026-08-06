package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.dto.ProductDtos;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository products;

    @Transactional(readOnly = true)
    public List<ProductDtos.ProductResponse> listPublic(String search) {
        List<Product> rows;
        if (search != null && !search.isBlank()) {
            String q = search.trim();
            rows = products.findByActiveTrueAndNameContainingIgnoreCaseOrActiveTrueAndSkuContainingIgnoreCase(q, q);
        } else {
            rows = products.findByActiveTrueOrderByNameAsc();
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProductDtos.ProductResponse getPublic(UUID id) {
        Product product = products.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toDto(product);
    }

    private ProductDtos.ProductResponse toDto(Product p) {
        ProductDtos.ProductResponse dto = new ProductDtos.ProductResponse();
        dto.setId(p.getId().toString());
        dto.setErpProductId(p.getErpProductId());
        dto.setSku(p.getSku());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setPrice(p.getPrice());
        dto.setCategory(p.getCategory());
        dto.setImageUrl(p.getImageUrl());
        dto.setStockQty(p.getStockQty());
        dto.setActive(p.isActive());
        dto.setPaymentOptions(p.getPaymentOptions());
        return dto;
    }
}
