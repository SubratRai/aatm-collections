package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByErpProductId(String erpProductId);
    List<Product> findByActiveTrueOrderByNameAsc();
    List<Product> findByActiveTrueAndNameContainingIgnoreCaseOrActiveTrueAndSkuContainingIgnoreCase(String name, String sku);

    @Query("select distinct p.category from Product p where p.active = true and p.category is not null order by p.category")
    List<String> findDistinctActiveCategories();
}
