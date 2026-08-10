package com.codelife.aatmCollections.config;

import com.codelife.aatmCollections.domain.Role;
import com.codelife.aatmCollections.entity.PaymentSettings;
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

        // Catalog comes from Retail360 via ERP sync — do not seed local-only products
        // (they have no erpProductId and break order matching / inventory sync).
        if (products.count() == 0) {
            log.info("No local products yet — run Admin → Catalog Sync from Retail360");
        }
    }
}
