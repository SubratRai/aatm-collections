package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.dto.ProductDtos;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository products;

    @Transactional(readOnly = true)
    public List<ProductDtos.ProductResponse> listPublic(ProductDtos.ProductFilter filter) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));

            if (filter.search() != null && !filter.search().isBlank()) {
                String q = "%" + filter.search().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), q),
                        cb.like(cb.lower(root.get("sku")), q),
                        cb.like(cb.lower(root.get("description")), q)));
            }
            if (filter.category() != null && !filter.category().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), filter.category().trim().toLowerCase()));
            }
            if (filter.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.minPrice()));
            }
            if (filter.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.maxPrice()));
            }
            if (Boolean.TRUE.equals(filter.inStock())) {
                predicates.add(cb.greaterThan(root.get("stockQty"), 0));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return products.findAll(spec, toSort(filter.sort())).stream().map(this::toDto).toList();
    }

    private Sort toSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.ASC, "name");
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> Sort.by(Sort.Direction.ASC, "name");
        };
    }

    @Transactional(readOnly = true)
    public List<String> listCategories() {
        return products.findDistinctActiveCategories();
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
        java.util.List<String> gallery = p.getImageUrls();
        if (gallery == null || gallery.isEmpty()) {
            gallery = p.getImageUrl() == null || p.getImageUrl().isBlank()
                    ? java.util.List.of()
                    : java.util.List.of(p.getImageUrl());
        }
        dto.setImageUrls(gallery);
        dto.setStockQty(p.getStockQty());
        dto.setActive(p.isActive());
        dto.setPaymentOptions(p.getPaymentOptions());
        return dto;
    }
}
