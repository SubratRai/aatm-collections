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

    /** Posts a storefront order (customer + items + delivery) to Retail360. */
    public JsonNode postOrder(JsonNode orderPayload) {
        try {
            return client().post()
                    .uri("/api/ecommerce/orders")
                    .header("Authorization", "Bearer " + token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(orderPayload)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new ErpUnavailableException(
                    "Retail360 order push failed: " + e.getMessage(), e);
        }
    }

    /** Fetches the entire catalog from Retail360. */
    public List<ErpCatalogItem> fetchCatalog() {
        try {
            List<ErpCatalogItem> all = new ArrayList<>();
            JsonNode res = client().get()
                    .uri(uri -> uri.path("/api/ecommerce/catalog")
                            .queryParam("channelCode", props.getChannelCode())
                            .queryParam("limit", "all")
                            .build())
                    .header("Authorization", "Bearer " + token())
                    .retrieve()
                    .body(JsonNode.class);
            if (res != null) {
                for (JsonNode n : res.path("items")) {
                    all.add(toItem(n));
                }
            }
            log.info("Fetched {} catalog items from Retail360", all.size());
            return all;
        } catch (RestClientException e) {
            throw new ErpUnavailableException(
                    "Retail360 unreachable at " + props.getBaseUrl() + ": " + e.getMessage(), e);
        }
    }

    /** Fetches a single catalog product (live stock/price) by Retail360 product id. */
    public ErpCatalogItem fetchProduct(String erpProductId) {
        try {
            JsonNode n = client().get()
                    .uri(uri -> uri.path("/api/ecommerce/products/{id}")
                            .queryParam("channelCode", props.getChannelCode())
                            .build(erpProductId))
                    .header("Authorization", "Bearer " + token())
                    .retrieve()
                    .body(JsonNode.class);
            if (n == null) {
                throw new ErpUnavailableException("Retail360 returned empty product for " + erpProductId);
            }
            return toItem(n);
        } catch (RestClientException e) {
            throw new ErpUnavailableException(
                    "Retail360 product fetch failed for " + erpProductId + ": " + e.getMessage(), e);
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
