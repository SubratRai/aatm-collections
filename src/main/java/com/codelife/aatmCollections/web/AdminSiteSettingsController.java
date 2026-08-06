package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.SiteSettingsDtos;
import com.codelife.aatmCollections.service.SiteSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/site-settings")
@RequiredArgsConstructor
public class AdminSiteSettingsController {

    private final SiteSettingsService siteSettingsService;

    @GetMapping
    public SiteSettingsDtos.SiteSettingsResponse get() {
        return siteSettingsService.get();
    }

    @PutMapping
    public SiteSettingsDtos.SiteSettingsResponse update(@Valid @RequestBody SiteSettingsDtos.SiteSettingsUpdateRequest request) {
        return siteSettingsService.update(request);
    }
}
