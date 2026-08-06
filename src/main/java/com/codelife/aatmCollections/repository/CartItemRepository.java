package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.CartItem;
import com.codelife.aatmCollections.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByUserOrderByAddedAtDesc(UserAccount user);
    Optional<CartItem> findByUserAndProductId(UserAccount user, UUID productId);
    void deleteByUser(UserAccount user);
}
