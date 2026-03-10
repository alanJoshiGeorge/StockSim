package com.stocksim.backend.controllers;

import com.stocksim.backend.service.StockService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "http://localhost:5173") // allow frontend
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // Get all stocks
    @GetMapping
    public List<Map<String, Object>> getAllStocks() {
        return stockService.getAllStocks();
    }

    // Get single stock info
    @GetMapping("/{symbol}")
    public Map<String, Object> getStock(@PathVariable String symbol) {
        return stockService.getStock(symbol);
    }

    // Dynamic search endpoint
    @GetMapping("/search")
    public Map<String, Object> searchStock(@RequestParam String query) {
        return stockService.searchStock(query);
    }

    // Get historical OHLC data for charts with optional period & interval
    @GetMapping("/{symbol}/history")
    public List<Map<String, Object>> getStockHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "5d") String period,
            @RequestParam(defaultValue = "5m") String interval) {
        return stockService.getStockHistory(symbol+".NS", period, interval);
    }
    @GetMapping("/trending")
    public List<Map<String, Object>> getTrendingStocks() {
        return stockService.getTrendingStocks();
    }
    @GetMapping("/sectors/trending")
    public Map<String, List<Map<String, Object>>> getTrendingSectors() {
        return stockService.getTrendingSectors();
    }

    @GetMapping("/indices")
    public List<Map<String, Object>> getIndianIndices() {
        return stockService.getIndianIndices();
    }

    @GetMapping("/market/overview")
    public List<Map<String, Object>> getMarketOverview() {
        return stockService.getMarketOverview();
}


}
