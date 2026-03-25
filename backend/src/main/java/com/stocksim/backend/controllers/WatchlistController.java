package com.stocksim.backend.controllers;

import com.stocksim.backend.model.User;
import com.stocksim.backend.model.Watchlist;
import com.stocksim.backend.repositories.UserRepository;
import com.stocksim.backend.repositories.WatchlistRepository;
import com.stocksim.backend.service.StockService;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.Objects;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "http://localhost:5173")
public class WatchlistController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private StockService stockService;

    @PostMapping("/add-stock")
    public ResponseEntity<?> addStockToWatchlist(@RequestBody Map<String, Object> request) {
        User user = userRepository.findById(Long.valueOf(request.get("userId").toString())).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        String symbol = request.get("symbol").toString().toUpperCase();

        // Check if already exists
        if (watchlistRepository.findByUserAndStockSymbol(user, symbol).isPresent()) {
            return ResponseEntity.badRequest().body("Stock already in watchlist");
        }

        Watchlist entry = new Watchlist();
        entry.setUser(user);
        entry.setStockSymbol(symbol);
        watchlistRepository.save(entry);

        return ResponseEntity.ok("Stock added to watchlist");
    }

    @PostMapping("/remove-stock")
    public ResponseEntity<?> removeStockFromWatchlist(@RequestBody Map<String, Object> request) {
        User user = userRepository.findById(Long.valueOf(request.get("userId").toString())).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        String symbol = request.get("symbol").toString().toUpperCase();

        // Check if stock exists
        if (watchlistRepository.findByUserAndStockSymbol(user, symbol).isEmpty()) {
            return ResponseEntity.badRequest().body("Stock not in watchlist");
        }

        // Delete entry
        watchlistRepository.deleteByUserAndStockSymbol(user, symbol);

        return ResponseEntity.ok("Stock removed from watchlist");
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getWatchlist(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        // Get all symbols from DB
        List<String> symbols = watchlistRepository.findAllByUser(user)
                .stream()
                .map(Watchlist::getStockSymbol)
                .collect(Collectors.toList());

        // Fetch full stock details using StockService
        List<Map<String, Object>> stocks = symbols.stream()
                .map(symbol -> {
                    try {
                        return stockService.getStock(symbol);
                    } catch (Exception e) {
                        System.err.println("Failed to fetch " + symbol);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return ResponseEntity.ok(stocks);
    }
}