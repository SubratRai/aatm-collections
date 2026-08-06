package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.ShopOrder;
import com.codelife.aatmCollections.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, UUID> {
    List<ShopOrder> findByUserOrderByCreatedAtDesc(UserAccount user);
}
