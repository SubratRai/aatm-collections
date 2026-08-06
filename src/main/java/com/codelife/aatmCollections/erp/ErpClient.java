package com.codelife.aatmCollections.erp;

import com.codelife.aatmCollections.config.ErpProperties;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for the Retail360 ERP e-commerce APIs.
 * Logs in with the configured Retail360 user, caches the JWT,
 * and pages through /api/ecommerce/catalog.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ErpClient {

    private final ErpProperties props;

    private volatile String cachedToken;
    private volatile Instant tokenFetchedAt;

    private RestClient client() {
        return RestClient.builder().baseUrl(props.getBaseUrl()).build();
    }

    private synchronized String token() {
        // Retail360 JWTs last 7 days; refresh well before that.
        if (cachedToken != null && tokenFetchedAt != null
                && tokenFetchedAt.isAfter(Instant.now().minus(Duration.ofHours(12)))) {
            return cachedToken;
        }
        JsonNode res = client().post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "usernameOrEmail", props.getUsername(),
                        "password", props.getPassword()))
                .retrieve()
                .body(JsonNode.class);
        if (res == null || !res.hasNonNull("token")) {
            throw new ErpUnavailableException("Retail360 login failed: no token in response");
        }
        cachedToken = res.get("token").asText();
        tokenFetchedAt = Instant.now();
        log.info("Authenticated with Retail360 at {}", props.getBaseUrl());
        return cachedToken;
    }

    /** Fetches the entire catalog (all pages) from Retail360. */
    public List<ErpCatalogItem> fetchCatalog() {
        try {
            List<ErpCatalogItem> all = new ArrayList<>();
            int page = 1;
            int totalPages = 1;
            do {
                final int currentPage = page;
                JsonNode res = client().get()
                        .uri(uri -> uri.path("/api/ecommerce/catalog")
                                .queryParam("channelCode", props.getChannelCode())
                                .queryParam("page", currentPage)
                                .queryParam("limit", 200)
                                .build())
                        .header("Authorization", "Bearer " + token())
                        .retrieve()
                        .body(JsonNode.class);
                if (res == null) break;
                JsonNode items = res.path("items");
                for (JsonNode n : items) {
                    all.add(toItem(n));
                }
                totalPages = res.path("pagination").path("totalPages").asInt(1);
                page++;
            } while (page <= totalPages);
            return all;
        } catch (RestClientException e) {
            throw new ErpUnavailableException(
                    "Retail360 unreachable at " + props.getBaseUrl() + ": " + e.getMessage(), e);
        }
    }

    private ErpCatalogItem toItem(JsonNode n) {
        BigDecimal price = n.hasNonNull("price") ? new BigDecimal(n.get("price").asText()) : null;
        return new ErpCatalogItem(
                n.path("erpProductId").asText(null),
                n.path("sku").asText(null),
                n.path("name").asText(null),
                n.path("description").asText(""),
                n.path("category").asText(null),
                n.path("brandName").asText(null),
                n.path("imageUrl").asText(null),
                price,
                n.path("stockQty").asInt(0));
    }

    public record ErpCatalogItem(
            String erpProductId,
            String sku,
            String name,
            String description,
            String category,
            String brandName,
            String imageUrl,
            BigDecimal price,
            int stockQty) {
    }

    public static class ErpUnavailableException extends RuntimeException {
        public ErpUnavailableException(String message) {
            super(message);
        }

        public ErpUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
