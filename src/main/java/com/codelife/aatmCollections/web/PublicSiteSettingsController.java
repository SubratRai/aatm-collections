package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.dto.SiteSettingsDtos;
import com.codelife.aatmCollections.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicSiteSettingsController {

    private final SiteSettingsService siteSettingsService;

    @GetMapping("/site-settings")
    public SiteSettingsDtos.SiteSettingsResponse get() {
        return siteSettingsService.get();
    }
}
