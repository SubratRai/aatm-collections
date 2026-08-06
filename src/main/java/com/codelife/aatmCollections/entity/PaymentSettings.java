package com.codelife.aatmCollections.entity;

import com.codelife.aatmCollections.domain.PaymentOptions;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "cod_enabled")
    @Builder.Default
    private boolean codEnabled = true;

    @Column(name = "online_enabled")
    @Builder.Default
    private boolean onlineEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_product_payment_options", length = 20)
    @Builder.Default
    private PaymentOptions defaultProductPaymentOptions = PaymentOptions.BOTH;

    @Column(name = "online_gateway", length = 30)
    @Builder.Default
    private String onlineGateway = "RAZORPAY";

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
