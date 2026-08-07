package com.codelife.aatmCollections.erp;

import com.codelife.aatmCollections.domain.OutboxStatus;
import com.codelife.aatmCollections.dto.OrderDtos;
import com.codelife.aatmCollections.entity.ErpOutbox;
import com.codelife.aatmCollections.entity.OrderItem;
import com.codelife.aatmCollections.entity.ShopOrder;
import com.codelife.aatmCollections.entity.UserAccount;
import com.codelife.aatmCollections.repository.ErpOutboxRepository;
import com.codelife.aatmCollections.repository.ShopOrderRepository;
import com.codelife.aatmCollections.repository.UserAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

/**
 * Transactional-outbox push of storefront orders to Retail360.
 * Each order gets a PENDING outbox row at checkout; a scheduler retries
 * until Retail360 accepts it (idempotent per order on the ERP side).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ErpOrderPushService {

    private static final int MAX_ATTEMPTS = 20;

    private final ErpOutboxRepository outbox;
    private final ShopOrderRepository orders;
    private final UserAccountRepository users;
    private final ErpClient erpClient;
    private final ObjectMapper objectMapper;

    /** Called inside the checkout transaction: stores the payload for reliable delivery. */
    public void enqueue(ShopOrder order, UserAccount account, OrderDtos.CheckoutRequest request) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("orderRef", order.getId().toString());
        payload.put("paymentMethod", request.getPaymentMethod());
        payload.put("paymentStatus", "pending");

        ObjectNode customer = payload.putObject("customer");
        customer.put("name", request.getFullName());
        customer.put("phone", request.getPhone());
        customer.put("email", account.getEmail());
        customer.put("address", Stream.of(request.getLine1(), request.getLine2(), request.getCity(),
                        request.getState(), request.getPostalCode(), request.getCountry())
                .filter(s -> s != null && !s.isBlank())
                .reduce((a, b) -> a + ", " + b)
                .orElse(""));

        ArrayNode items = payload.putArray("items");
        for (OrderItem item : order.getItems()) {
            ObjectNode n = items.addObject();
            n.put("erpProductId", item.getErpProductId());
            n.put("sku", item.getSku());
            n.put("name", item.getProductName());
            n.put("quantity", item.getQuantity());
            n.put("unitPrice", item.getUnitPrice());
        }

        outbox.save(ErpOutbox.builder()
                .order(order)
                .payload(payload.toString())
                .status(OutboxStatus.PENDING)
                .build());
    }

    /** Retries pending pushes every minute; first attempt lands ~seconds after checkout. */
    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT10S")
    @Transactional(propagation = Propagation.REQUIRED)
    public void pushPending() {
        List<ErpOutbox> rows = outbox.findTop20ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        for (ErpOutbox row : rows) {
            row.setAttempts(row.getAttempts() + 1);
            row.setLastAttemptAt(Instant.now());
            try {
                JsonNode response = erpClient.postOrder(objectMapper.readTree(row.getPayload()));
                row.setStatus(OutboxStatus.SENT);

                ShopOrder order = row.getOrder();
                if (order != null && response != null && response.hasNonNull("salesNumber")) {
                    order.setErpOrderId(response.get("salesNumber").asText());
                    orders.save(order);
                    if (response.hasNonNull("customerCode")) {
                        UserAccount account = order.getUser();
                        account.setErpCustomerId(response.get("customerCode").asText());
                        users.save(account);
                    }
                }
                log.info("Order {} pushed to Retail360 as {}", row.getOrder() != null
                        ? row.getOrder().getId() : "?", response != null ? response.path("salesNumber").asText() : "?");
            } catch (Exception e) {
                if (row.getAttempts() >= MAX_ATTEMPTS) {
                    row.setStatus(OutboxStatus.FAILED);
                    log.error("Order push permanently failed after {} attempts: {}", row.getAttempts(), e.getMessage());
                } else {
                    log.warn("Order push attempt {} failed, will retry: {}", row.getAttempts(), e.getMessage());
                }
            }
            outbox.save(row);
        }
    }
}
