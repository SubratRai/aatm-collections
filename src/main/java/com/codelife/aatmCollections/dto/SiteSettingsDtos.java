package com.codelife.aatmCollections.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public final class SiteSettingsDtos {
    private SiteSettingsDtos() {}

    @Data
    public static class SiteSettingsResponse {
        private String id;
        private String siteName;
        private String logoUrl;
        private String faviconUrl;
        private String primaryColor;
        private String secondaryColor;
        private String accentColor;
        private String backgroundColor;
        private String textColor;
        private String fontFamily;
        private String supportEmail;
        private String supportPhone;
        private String metaTitle;
        private String metaDescription;
    }

    @Data
    public static class SiteSettingsUpdateRequest {
        @NotBlank @Size(max = 255)
        private String siteName;
        private String logoUrl;
        private String faviconUrl;
        @NotBlank
        private String primaryColor;
        @NotBlank
        private String secondaryColor;
        @NotBlank
        private String accentColor;
        @NotBlank
        private String backgroundColor;
        @NotBlank
        private String textColor;
        private String fontFamily;
        private String supportEmail;
        private String supportPhone;
        private String metaTitle;
        private String metaDescription;
    }
}
