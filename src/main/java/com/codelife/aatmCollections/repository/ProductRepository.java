package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySku(String sku);
    List<Product> findByActiveTrueOrderByNameAsc();
    List<Product> findByActiveTrueAndNameContainingIgnoreCaseOrActiveTrueAndSkuContainingIgnoreCase(String name, String sku);
}
