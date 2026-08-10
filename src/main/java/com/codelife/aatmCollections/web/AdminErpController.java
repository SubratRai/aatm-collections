package com.codelife.aatmCollections.web;

import com.codelife.aatmCollections.erp.ErpClient;
import com.codelife.aatmCollections.erp.ErpSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/erp")
@RequiredArgsConstructor
public class AdminErpController {

    private final ErpSyncService erpSyncService;

    /** Full product sync: details, prices, images, and stock. */
    @PostMapping("/sync")
    public ErpSyncService.SyncResult sync() {
        try {
            return erpSyncService.syncCatalog();
        } catch (ErpClient.ErpUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    /** Quantity-only sync from Retail360. */
    @PostMapping("/sync-stock")
    public ErpSyncService.StockSyncResult syncStock() {
        try {
            return erpSyncService.syncStock();
        } catch (ErpClient.ErpUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/status")
    public ErpSyncService.SyncStatus status() {
        return erpSyncService.status();
    }
}
