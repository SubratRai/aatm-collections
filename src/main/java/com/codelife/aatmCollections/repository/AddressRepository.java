package com.codelife.aatmCollections.repository;

import com.codelife.aatmCollections.entity.Address;
import com.codelife.aatmCollections.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {
    List<Address> findByUserOrderByIsDefaultDesc(UserAccount user);
}
