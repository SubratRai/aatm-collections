package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.dto.SiteSettingsDtos;
import com.codelife.aatmCollections.entity.SiteSettings;
import com.codelife.aatmCollections.repository.SiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SiteSettingsService {

    private final SiteSettingsRepository repository;

    @Transactional(readOnly = true)
    public SiteSettingsDtos.SiteSettingsResponse get() {
        return toDto(getOrCreate());
    }

    @Transactional
    public SiteSettingsDtos.SiteSettingsResponse update(SiteSettingsDtos.SiteSettingsUpdateRequest request) {
        SiteSettings settings = getOrCreate();
        settings.setSiteName(request.getSiteName().trim());
        settings.setLogoUrl(blankToNull(request.getLogoUrl()));
        settings.setFaviconUrl(blankToNull(request.getFaviconUrl()));
        settings.setPrimaryColor(request.getPrimaryColor().trim());
        settings.setSecondaryColor(request.getSecondaryColor().trim());
        settings.setAccentColor(request.getAccentColor().trim());
        settings.setBackgroundColor(request.getBackgroundColor().trim());
        settings.setTextColor(request.getTextColor().trim());
        settings.setFontFamily(blankToNull(request.getFontFamily()));
        settings.setSupportEmail(blankToNull(request.getSupportEmail()));
        settings.setSupportPhone(blankToNull(request.getSupportPhone()));
        settings.setMetaTitle(blankToNull(request.getMetaTitle()));
        settings.setMetaDescription(blankToNull(request.getMetaDescription()));
        return toDto(repository.save(settings));
    }

    @Transactional
    public SiteSettings getOrCreate() {
        return repository.findFirstByOrderByUpdatedAtDesc()
                .orElseGet(() -> repository.save(SiteSettings.builder()
                        .siteName("Aatm Collections")
                        .metaTitle("Aatm Collections")
                        .metaDescription("Shop curated collections online.")
                        .supportEmail("hello@aatmcollections.local")
                        .build()));
    }

    private SiteSettingsDtos.SiteSettingsResponse toDto(SiteSettings s) {
        SiteSettingsDtos.SiteSettingsResponse dto = new SiteSettingsDtos.SiteSettingsResponse();
        dto.setId(s.getId() != null ? s.getId().toString() : null);
        dto.setSiteName(s.getSiteName());
        dto.setLogoUrl(s.getLogoUrl());
        dto.setFaviconUrl(s.getFaviconUrl());
        dto.setPrimaryColor(s.getPrimaryColor());
        dto.setSecondaryColor(s.getSecondaryColor());
        dto.setAccentColor(s.getAccentColor());
        dto.setBackgroundColor(s.getBackgroundColor());
        dto.setTextColor(s.getTextColor());
        dto.setFontFamily(s.getFontFamily());
        dto.setSupportEmail(s.getSupportEmail());
        dto.setSupportPhone(s.getSupportPhone());
        dto.setMetaTitle(s.getMetaTitle());
        dto.setMetaDescription(s.getMetaDescription());
        return dto;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
