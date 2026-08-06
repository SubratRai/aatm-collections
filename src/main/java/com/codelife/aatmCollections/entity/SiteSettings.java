package com.codelife.aatmCollections.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "site_name", nullable = false, length = 255)
    @Builder.Default
    private String siteName = "Aatm Collections";

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "favicon_url", columnDefinition = "TEXT")
    private String faviconUrl;

    @Column(name = "primary_color", length = 20)
    @Builder.Default
    private String primaryColor = "#1f4b3a";

    @Column(name = "secondary_color", length = 20)
    @Builder.Default
    private String secondaryColor = "#c4a35a";

    @Column(name = "accent_color", length = 20)
    @Builder.Default
    private String accentColor = "#e8d5a3";

    @Column(name = "background_color", length = 20)
    @Builder.Default
    private String backgroundColor = "#f7f4ef";

    @Column(name = "text_color", length = 20)
    @Builder.Default
    private String textColor = "#1a1a1a";

    @Column(name = "font_family", length = 120)
    @Builder.Default
    private String fontFamily = "Georgia, 'Times New Roman', serif";

    @Column(name = "support_email", length = 255)
    private String supportEmail;

    @Column(name = "support_phone", length = 30)
    private String supportPhone;

    @Column(name = "meta_title", length = 255)
    private String metaTitle;

    @Column(name = "meta_description", columnDefinition = "TEXT")
    private String metaDescription;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
