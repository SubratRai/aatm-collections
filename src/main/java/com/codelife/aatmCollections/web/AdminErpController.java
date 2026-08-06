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

    @PostMapping("/sync")
    public ErpSyncService.SyncResult sync() {
        try {
            return erpSyncService.syncCatalog();
        } catch (ErpClient.ErpUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
    }

    @GetMapping("/status")
    public ErpSyncService.SyncStatus status() {
        return erpSyncService.status();
    }
}
