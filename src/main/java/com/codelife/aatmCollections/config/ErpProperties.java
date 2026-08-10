package com.codelife.aatmCollections.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.erp")
@Getter
@Setter
public class ErpProperties {

    /** Base URL of the Retail360 API, e.g. http://localhost:5000 */
    private String baseUrl = "http://localhost:5000";

    /** Retail360 login (JWT auth) used by the sync client. */
    private String username = "admin";
    private String password = "admin123";

    /** Sales channel code on Retail360 used for price/stock resolution. */
    private String channelCode = "ECOM";

    /** Enable/disable scheduled full catalog sync (details/prices). Manual sync always works. */
    private boolean scheduledSyncEnabled = false;

    /** Enable/disable scheduled quantity sync every minute. */
    private boolean stockSyncEnabled = true;
}
