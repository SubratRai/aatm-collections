package com.codelife.aatmCollections.config;

import com.codelife.aatmCollections.domain.PaymentOptions;
import com.codelife.aatmCollections.domain.Role;
import com.codelife.aatmCollections.entity.PaymentSettings;
import com.codelife.aatmCollections.entity.Product;
import com.codelife.aatmCollections.entity.UserAccount;
import com.codelife.aatmCollections.repository.PaymentSettingsRepository;
import com.codelife.aatmCollections.repository.ProductRepository;
import com.codelife.aatmCollections.repository.UserAccountRepository;
import com.codelife.aatmCollections.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserAccountRepository users;
    private final ProductRepository products;
    private final PaymentSettingsRepository paymentSettings;
    private final SiteSettingsService siteSettingsService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        siteSettingsService.getOrCreate();

        if (paymentSettings.count() == 0) {
            paymentSettings.save(PaymentSettings.builder().build());
        }

        if (!users.existsByEmailIgnoreCase("admin@aatm.local")) {
            users.save(UserAccount.builder()
                    .email("admin@aatm.local")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("Store Admin")
                    .role(Role.ADMIN)
                    .build());
            log.info("Seeded admin user admin@aatm.local / admin123");
        }

        if (products.count() == 0) {
            products.save(Product.builder()
                    .sku("AATM-001")
                    .name("Heritage Brass Diya")
                    .description("Handcrafted brass diya for festive décor.")
                    .price(new BigDecimal("499.00"))
                    .category("Home")
                    .stockQty(25)
                    .paymentOptions(PaymentOptions.BOTH)
                    .active(true)
                    .build());
            products.save(Product.builder()
                    .sku("AATM-002")
                    .name("Cotton Kurta Set")
                    .description("Soft cotton everyday kurta set.")
                    .price(new BigDecimal("1299.00"))
                    .category("Apparel")
                    .stockQty(40)
                    .paymentOptions(PaymentOptions.BOTH)
                    .active(true)
                    .build());
            log.info("Seeded sample catalog products");
        }
    }
}
